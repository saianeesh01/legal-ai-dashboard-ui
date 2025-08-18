"""
Batch Document Processor for Legal AI
Handles up to 5 files with bounded parallelism and LLM concurrency caps
"""

import os
import uuid
import hashlib
import json
import logging
from concurrent.futures import ProcessPoolExecutor, as_completed
from threading import Semaphore
import psutil
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class JobStatus:
    """Job status tracking"""
    id: str
    filename: str
    status: str  # queued, running, done, error
    file_path: str
    result_path: Optional[str] = None
    error_message: Optional[str] = None
    doc_type: Optional[str] = None

@dataclass
class BatchStatus:
    """Batch status tracking"""
    batch_id: str
    jobs: List[JobStatus]
    created_at: str
    completed_count: int = 0
    error_count: int = 0

class ConcurrencyManager:
    """Manages CPU and LLM concurrency limits"""
    
    def __init__(self):
        self.cpu_cores = os.cpu_count() or 4
        self.max_workers = max(1, self.cpu_cores // 2)
        # Allow more concurrent LLM calls for parallel processing
        self.llm_concurrency = min(5, self.cpu_cores)  # Up to 5 concurrent LLM calls
        
        # Semaphore to limit concurrent LLM calls
        self.llm_semaphore = Semaphore(self.llm_concurrency)
        
        logger.info(f"Concurrency: {self.max_workers} workers, {self.llm_concurrency} LLM calls")
    
    def cpu_guard(self, target_util: float = 75.0) -> None:
        """Wait if CPU usage is too high"""
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            if cpu_percent > target_util:
                logger.info(f"CPU usage {cpu_percent}% > {target_util}%, waiting...")
                import time
                time.sleep(1)
        except Exception as e:
            logger.warning(f"CPU monitoring failed: {e}")

class BatchProcessor:
    """Main batch processing orchestrator"""
    
    def __init__(self):
        self.concurrency_manager = ConcurrencyManager()
        self.batches: Dict[str, BatchStatus] = {}
        
        # Ensure directories exist
        self.uploads_dir = Path("uploads")
        self.results_dir = Path("results")
        self.uploads_dir.mkdir(exist_ok=True)
        self.results_dir.mkdir(exist_ok=True)
    
    def create_batch(self, files: List[Tuple[str, bytes]]) -> str:
        """Create a new batch for processing"""
        batch_id = str(uuid.uuid4())
        
        # Create jobs for each file
        jobs = []
        for filename, file_content in files:
            job_id = str(uuid.uuid4())
            
            # Save file with UUID prefix
            safe_filename = f"{job_id}_{filename}"
            file_path = self.uploads_dir / safe_filename
            
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            job = JobStatus(
                id=job_id,
                filename=filename,
                status="queued",
                file_path=str(file_path)
            )
            jobs.append(job)
        
        # Create batch
        batch = BatchStatus(
            batch_id=batch_id,
            jobs=jobs,
            created_at=str(uuid.uuid4())  # Simple timestamp for now
        )
        
        self.batches[batch_id] = batch
        logger.info(f"Created batch {batch_id} with {len(jobs)} jobs")
        
        # Start processing in background
        self._process_batch_async(batch_id)
        
        return batch_id
    
    def _process_batch_async(self, batch_id: str) -> None:
        """Process batch asynchronously"""
        import threading
        
        def process():
            try:
                self._process_batch(batch_id)
            except Exception as e:
                logger.error(f"Batch processing failed: {e}")
        
        thread = threading.Thread(target=process, daemon=True)
        thread.start()
    
    def _process_batch(self, batch_id: str) -> None:
        """Process all jobs in a batch"""
        batch = self.batches[batch_id]
        
        # Sort jobs by file size (shortest first)
        batch.jobs.sort(key=lambda j: os.path.getsize(j.file_path))
        
        # Use ThreadPoolExecutor instead of ProcessPoolExecutor to avoid pickle issues
        from concurrent.futures import ThreadPoolExecutor
        
        with ThreadPoolExecutor(max_workers=len(batch.jobs)) as executor:
            # Submit all jobs
            future_to_job = {
                executor.submit(self._process_single_job, job): job
                for job in batch.jobs
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_job):
                job = future_to_job[future]
                try:
                    result = future.result()
                    job.status = "done"
                    job.result_path = result.get("result_path")
                    job.doc_type = result.get("doc_type")
                    batch.completed_count += 1
                    logger.info(f"Job {job.id} completed successfully")
                except Exception as e:
                    job.status = "error"
                    job.error_message = str(e)
                    batch.error_count += 1
                    logger.error(f"Job {job.id} failed: {e}")
    
    def _process_single_job(self, job: JobStatus) -> Dict:
        """Process a single job with the full pipeline"""
        try:
            # Update status
            job.status = "running"
            
            # CPU guard before heavy operations
            self.concurrency_manager.cpu_guard()
            
            # Parse PDF
            parsed_content = self._parse_pdf(job.file_path)
            
            # Build embeddings (with caching)
            embeddings = self._build_embeddings(parsed_content, job.file_path)
            
            # Extract with LLM (with concurrency control)
            extraction_result = self._extract_with_llm(parsed_content, embeddings)
            
            # Save result
            result_path = self._save_result(job.filename, extraction_result)
            
            return {
                "result_path": result_path,
                "doc_type": extraction_result.get("doc_type", "unknown"),
                "ok": True
            }
            
        except Exception as e:
            logger.error(f"Job processing failed: {e}")
            raise
    
    def _parse_pdf(self, file_path: str) -> str:
        """Parse PDF content using PyMuPDF"""
        try:
            import fitz  # PyMuPDF
            
            doc = fitz.open(file_path)
            text = ""
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text += page.get_text()
            
            doc.close()
            return text
            
        except Exception as e:
            logger.error(f"PDF parsing failed: {e}")
            # Fallback: try to read as text
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            except:
                return f"Error parsing file: {e}"
    
    def _build_embeddings(self, content: str, file_path: str) -> str:
        """Build FAISS embeddings (cached by file hash)"""
        # Simple hash-based caching
        file_hash = hashlib.md5(content.encode()).hexdigest()
        cache_file = self.results_dir / f"embeddings_{file_hash}.json"
        
        if cache_file.exists():
            logger.info(f"Using cached embeddings for {file_path}")
            return "cached_embeddings"
        
        # TODO: Implement actual FAISS embedding
        # For now, just return a placeholder
        logger.info(f"Building embeddings for {file_path}")
        return "new_embeddings"
    
    def _extract_with_llm(self, content: str, embeddings: str) -> Dict:
        """Extract legal information using LLM with concurrency control"""
        # Acquire LLM semaphore
        with self.concurrency_manager.llm_semaphore:
            logger.info("Acquired LLM semaphore, processing...")
            
            # CPU guard before LLM call
            self.concurrency_manager.cpu_guard()
            
            # TODO: Implement actual LLM call to Ollama
            # For now, return mock result
            import time
            time.sleep(2)  # Simulate LLM processing
            
            return {
                "doc_type": "mock_document",
                "meta": {
                    "title": "Mock Document",
                    "jurisdiction_or_body": "Mock Court",
                    "date_iso": "2025-01-01",
                    "page_count": 1
                },
                "sections": {
                    "extracted_items": [
                        {
                            "label": "Mock Item",
                            "value": "Mock Value",
                            "page": 1,
                            "evidence": "Mock evidence text",
                            "confidence": 0.9
                        }
                    ]
                }
            }
    
    def _save_result(self, filename: str, result: Dict) -> str:
        """Save extraction result to JSON file"""
        # Create result filename
        stem = Path(filename).stem
        result_path = self.results_dir / f"{stem}.json"
        
        # Save result
        with open(result_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved result to {result_path}")
        return str(result_path)
    
    def get_batch_status(self, batch_id: str) -> Optional[BatchStatus]:
        """Get current status of a batch"""
        return self.batches.get(batch_id)
    
    def list_batches(self) -> List[str]:
        """List all batch IDs"""
        return list(self.batches.keys())

# Global instance
batch_processor = BatchProcessor()
