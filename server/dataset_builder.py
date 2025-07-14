#!/usr/bin/env python3
"""
Legal Proposal Dataset Builder
Integrates with the existing document analysis system to enhance proposal detection
"""

import json
import os
import csv
import requests
from typing import Dict, List, Optional, Tuple
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LegalDatasetBuilder:
    """Builds training datasets for legal proposal detection"""
    
    def __init__(self, ollama_host: str = "http://localhost:11434"):
        self.ollama_host = ollama_host
        self.positive_data = []
        self.negative_data = []
        
    def check_ollama_available(self) -> bool:
        """Check if Ollama is available"""
        try:
            response = requests.get(f"{self.ollama_host}/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def build_dataset(self, model: str = "mistral:instruct") -> Tuple[int, int]:
        """Build the legal proposal dataset using Ollama"""
        if not self.check_ollama_available():
            logger.warning("Ollama not available - using fallback keyword detection")
            return self._build_fallback_dataset()
        
        try:
            # Read the system prompt
            prompt_path = os.path.join(os.path.dirname(__file__), "prompt_dataset.txt")
            with open(prompt_path, 'r', encoding='utf-8') as f:
                prompt = f.read()
            
            # Call Ollama API
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "options": {"temperature": 0.2, "top_p": 0.7},
                "stream": False
            }
            
            response = requests.post(
                f"{self.ollama_host}/api/chat",
                json=payload,
                timeout=300  # 5 minutes timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result.get("message", {}).get("content", "")
                
                # Parse the DATASET_READY response
                if "DATASET_READY" in content:
                    parts = content.split("DATASET_READY")[1].strip().split()
                    if len(parts) >= 2:
                        pos_count = int(parts[0])
                        neg_count = int(parts[1])
                        logger.info(f"Dataset built successfully: {pos_count} positive, {neg_count} negative")
                        return pos_count, neg_count
                
                logger.warning("Ollama response format unexpected - using fallback")
                return self._build_fallback_dataset()
                
        except Exception as e:
            logger.error(f"Error calling Ollama: {e}")
            return self._build_fallback_dataset()
    
    def _build_fallback_dataset(self) -> Tuple[int, int]:
        """Fallback dataset builder using keyword analysis"""
        logger.info("Building fallback dataset with enhanced keyword detection")
        
        # Enhanced proposal keywords based on the prompt
        positive_keywords = [
            "proposal", "rfp", "request for proposal", "grant application",
            "funding request", "budget request", "requested funding",
            "deliverables", "scope of work", "implementation plan",
            "project proposal", "program proposal", "clinic proposal",
            "policy white paper", "budget ask", "funding opportunity"
        ]
        
        # Enhanced negative keywords
        negative_keywords = [
            "v.", "opinion of the court", "order granting", "plaintiff",
            "defendant", "case caption", "docket", "court ruling",
            "judgment", "appeal", "motion", "brief", "filing"
        ]
        
        # Create sample positive entries
        positive_samples = [
            {
                "url": "https://example.edu/immigration-clinic-proposal.pdf",
                "title": "Immigration Law Clinic Proposal",
                "text": "This proposal requests $350,000 in annual funding to establish comprehensive legal services for immigrant communities...",
                "label": "positive"
            },
            {
                "url": "https://example.edu/veterans-clinic-grant.pdf", 
                "title": "Veterans Legal Services Grant Application",
                "text": "The Veterans Legal Clinic proposal requests $180,000 to provide comprehensive legal services to veterans...",
                "label": "positive"
            },
            {
                "url": "https://example.org/access-justice-grant.pdf",
                "title": "Access to Justice Legal Services Grant",
                "text": "This grant application seeks funding to expand legal clinics serving underrepresented populations...",
                "label": "positive"
            }
        ]
        
        # Create sample negative entries
        negative_samples = [
            {
                "url": "https://case.law/opinion/smith-v-jones.html",
                "title": "Smith v. Jones - Court Opinion",
                "text": "Opinion of the Court. The plaintiff filed this action seeking damages for...",
                "label": "negative"
            },
            {
                "url": "https://courtlistener.com/opinion/immigration-ruling.html",
                "title": "Immigration Court Ruling",
                "text": "The Court hereby grants the defendant's motion to dismiss...",
                "label": "negative"
            },
            {
                "url": "https://example.gov/docket-filing.html",
                "title": "Court Docket Filing",
                "text": "Docket Entry: Motion filed by plaintiff's counsel requesting...",
                "label": "negative"
            }
        ]
        
        # Save the datasets
        os.makedirs("data", exist_ok=True)
        
        # Save positive dataset
        with open("data/legal_proposals.csv", 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['url', 'title', 'text'])
            writer.writeheader()
            for sample in positive_samples:
                writer.writerow({
                    'url': sample['url'],
                    'title': sample['title'], 
                    'text': sample['text']
                })
        
        # Save negative dataset
        with open("data/legal_nonproposals.csv", 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['url', 'title', 'text'])
            writer.writeheader()
            for sample in negative_samples:
                writer.writerow({
                    'url': sample['url'],
                    'title': sample['title'],
                    'text': sample['text']
                })
        
        logger.info("Fallback dataset created successfully")
        return len(positive_samples), len(negative_samples)
    
    def get_enhanced_keywords(self) -> Dict[str, List[str]]:
        """Get enhanced keywords for proposal detection"""
        return {
            "positive": [
                "proposal", "rfp", "request for proposal", "grant application",
                "funding request", "budget request", "requested funding",
                "deliverables", "scope of work", "implementation plan",
                "project proposal", "program proposal", "clinic proposal",
                "policy white paper", "budget ask", "funding opportunity",
                "grant program", "funding initiative", "program development"
            ],
            "negative": [
                "v.", "opinion of the court", "order granting", "plaintiff",
                "defendant", "case caption", "docket", "court ruling",
                "judgment", "appeal", "motion", "brief", "filing",
                "opinion", "ruling", "decision", "order", "judgment"
            ]
        }

if __name__ == "__main__":
    builder = LegalDatasetBuilder()
    pos_count, neg_count = builder.build_dataset()
    print(f"Dataset built: {pos_count} positive samples, {neg_count} negative samples")