"""
FAISS Vector Search Implementation
Provides semantic similarity search to reduce LLM load
"""

import os
import json
import logging
import pickle
from typing import List, Dict, Tuple, Optional
import numpy as np
import faiss
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

class VectorSearchEngine:
    """FAISS-based semantic similarity search engine using TF-IDF"""
    
    def __init__(self):
        self.vectorizer = None
        self.index = None
        self.chunks = []
        self.chunk_metadata = []
        self.index_path = "vector_index"
        self.metadata_path = "chunk_metadata.pkl"
        self.tfidf_matrix = None
        
    def create_chunks(self, text: str, chunk_size: int = 1500, overlap: int = 200) -> List[str]:
        """Create overlapping chunks for better semantic search"""
        chunks = []
        sentences = text.split('. ')
        
        current_chunk = ""
        for sentence in sentences:
            if len(current_chunk) + len(sentence) <= chunk_size:
                current_chunk += sentence + ". "
            else:
                if current_chunk.strip():
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + ". "
        
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        # Create overlapping chunks for better context
        overlapping_chunks = []
        for i, chunk in enumerate(chunks):
            if i > 0:
                # Add overlap from previous chunk
                prev_chunk = chunks[i-1]
                overlap_text = prev_chunk[-overlap:] if len(prev_chunk) > overlap else prev_chunk
                chunk = overlap_text + " " + chunk
            
            overlapping_chunks.append(chunk)
        
        return overlapping_chunks
    
    def build_index(self, text: str, document_id: str, filename: str) -> bool:
        """Build FAISS index from document text using TF-IDF"""
        try:
            logger.info(f"🔍 Building FAISS index for document: {filename}")
            
            # Create chunks
            chunks = self.create_chunks(text)
            if not chunks:
                logger.warning("⚠️ No chunks created from text")
                return False
            
            # Initialize TF-IDF vectorizer
            self.vectorizer = TfidfVectorizer(
                max_features=1000,
                stop_words='english',
                ngram_range=(1, 2),
                min_df=1,
                max_df=1.0  # Allow all terms for single documents
            )
            
            # Generate TF-IDF embeddings
            logger.info(f"📊 Generating TF-IDF embeddings for {len(chunks)} chunks")
            self.tfidf_matrix = self.vectorizer.fit_transform(chunks)
            
            # Convert to dense array for FAISS
            embeddings = self.tfidf_matrix.toarray().astype('float32')
            
            # Initialize FAISS index
            dimension = embeddings.shape[1]
            self.index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
            
            # Normalize embeddings for cosine similarity
            faiss.normalize_L2(embeddings)
            
            # Add to index
            self.index.add(embeddings)
            
            # Store chunks and metadata
            self.chunks = chunks
            self.chunk_metadata = [
                {
                    "document_id": document_id,
                    "filename": filename,
                    "chunk_index": i,
                    "chunk_size": len(chunk)
                }
                for i, chunk in enumerate(chunks)
            ]
            
            # Save index and metadata
            self._save_index()
            
            logger.info(f"✅ FAISS index built successfully: {len(chunks)} chunks, {dimension} dimensions")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to build FAISS index: {e}")
            return False
    
    def search(self, query: str, top_k: int = 3) -> List[Dict]:
        """Search for semantically similar chunks"""
        try:
            if self.index is None or len(self.chunks) == 0 or self.vectorizer is None:
                logger.warning("⚠️ No index available for search")
                return []
            
            # Generate query embedding using TF-IDF
            query_vector = self.vectorizer.transform([query])
            query_embedding = query_vector.toarray().astype('float32')
            faiss.normalize_L2(query_embedding)
            
            # Search the index
            scores, indices = self.index.search(query_embedding, top_k)
            
            # Prepare results
            results = []
            for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
                if idx < len(self.chunks):
                    results.append({
                        "chunk": self.chunks[idx],
                        "score": float(score),
                        "metadata": self.chunk_metadata[idx] if idx < len(self.chunk_metadata) else {},
                        "rank": i + 1
                    })
            
            logger.info(f"🔍 Found {len(results)} relevant chunks for query: '{query[:50]}...'")
            return results
            
        except Exception as e:
            logger.error(f"❌ Search failed: {e}")
            return []
    
    def _save_index(self):
        """Save FAISS index and metadata"""
        try:
            if self.index is not None:
                faiss.write_index(self.index, f"{self.index_path}.faiss")
                
            with open(self.metadata_path, 'wb') as f:
                pickle.dump({
                    "chunks": self.chunks,
                    "metadata": self.chunk_metadata,
                    "vectorizer": self.vectorizer
                }, f)
                
            logger.info("💾 Index and metadata saved successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to save index: {e}")
    
    def _load_index(self) -> bool:
        """Load existing FAISS index and metadata"""
        try:
            if os.path.exists(f"{self.index_path}.faiss"):
                self.index = faiss.read_index(f"{self.index_path}.faiss")
                
            if os.path.exists(self.metadata_path):
                with open(self.metadata_path, 'rb') as f:
                    data = pickle.load(f)
                    self.chunks = data.get("chunks", [])
                    self.chunk_metadata = data.get("metadata", [])
                    self.vectorizer = data.get("vectorizer")
                
                logger.info(f"📂 Loaded existing index: {len(self.chunks)} chunks")
                return True
                
        except Exception as e:
            logger.error(f"❌ Failed to load index: {e}")
            
        return False
    
    def get_index_stats(self) -> Dict:
        """Get statistics about the current index"""
        if self.index is None:
            return {"status": "no_index"}
        
        return {
            "status": "active",
            "total_chunks": len(self.chunks),
            "index_size": self.index.ntotal,
            "dimension": self.index.d,
            "model": "tfidf"
        }
    
    def clear_index(self):
        """Clear the current index"""
        self.index = None
        self.chunks = []
        self.chunk_metadata = []
        self.vectorizer = None
        self.tfidf_matrix = None
        
        # Remove saved files
        for file_path in [f"{self.index_path}.faiss", self.metadata_path]:
            if os.path.exists(file_path):
                os.remove(file_path)
        
        logger.info("🗑️ Index cleared successfully")

# Global instance
vector_engine = VectorSearchEngine() 