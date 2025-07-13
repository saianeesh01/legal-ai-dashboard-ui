#!/usr/bin/env python3
"""
AI Document Analysis Service using PaddleOCR, Faiss, and Ollama
"""

import os
import json
import logging
from typing import List, Dict, Any, Tuple
from pathlib import Path
import tempfile
import base64

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image
import faiss
from sentence_transformers import SentenceTransformer
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables for models
ocr = None
embedding_model = None
faiss_index = None
document_chunks = []

def initialize_models():
    """Initialize OCR and embedding models"""
    global ocr, embedding_model
    
    try:
        # Initialize PaddleOCR
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        logger.info("PaddleOCR initialized successfully")
        
        # Initialize sentence transformer for embeddings
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("Embedding model initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing models: {e}")
        raise

def extract_text_from_image(image_path: str) -> List[Dict[str, Any]]:
    """Extract text from image using PaddleOCR"""
    try:
        result = ocr.ocr(image_path, cls=True)
        
        extracted_text = []
        if result and result[0]:
            for line in result[0]:
                if len(line) >= 2:
                    bbox, (text, confidence) = line
                    if confidence > 0.5:  # Filter low confidence text
                        extracted_text.append({
                            'text': text,
                            'confidence': confidence,
                            'bbox': bbox
                        })
        
        return extracted_text
    except Exception as e:
        logger.error(f"OCR extraction error: {e}")
        return []

def create_faiss_index(texts: List[str]) -> Tuple[faiss.Index, List[str]]:
    """Create FAISS index from text chunks"""
    global embedding_model
    
    # Generate embeddings
    embeddings = embedding_model.encode(texts)
    embeddings = np.array(embeddings).astype('float32')
    
    # Create FAISS index
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)  # Inner product for similarity
    faiss.normalize_L2(embeddings)  # Normalize for cosine similarity
    index.add(embeddings)
    
    return index, texts

def chunk_text(text: str, chunk_size: int = 400) -> List[str]:
    """Split text into chunks for better processing"""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size//4):  # Overlap chunks
        chunk = ' '.join(words[i:i + chunk_size//4])
        if len(chunk.strip()) > 50:  # Only keep substantial chunks
            chunks.append(chunk.strip())
    
    return chunks

def query_ollama(prompt: str, model: str = "llama3.2:3b") -> str:
    """Query local Ollama model"""
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "top_p": 0.9,
                    "max_tokens": 1000
                }
            },
            timeout=60
        )
        
        if response.status_code == 200:
            return response.json().get("response", "")
        else:
            logger.error(f"Ollama API error: {response.status_code}")
            return "Error: Could not connect to Ollama service"
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Ollama connection error: {e}")
        return "Error: Ollama service not available. Please ensure Ollama is running locally."

def analyze_document_with_ai(text_content: str, filename: str) -> Dict[str, Any]:
    """Analyze document using Ollama to determine if it's a proposal"""
    
    # Create chunks for context
    chunks = chunk_text(text_content, 400)
    context_sample = '\n'.join(chunks[:10])  # Use first 10 chunks for analysis
    
    prompt = f"""
SYSTEM: You are LegalDoc AI, a concise, citation-aware assistant.
All answers must be derived only from the provided context.
Never invent facts, statutes, or page numbers.
When unsure, reply "I don't know from the context."

USER:
DOC_META:
- file_name: {filename}
- total_pages: estimated

CONTEXT:
{context_sample}

TASKS:
1. Classify — Is this a *proposal* document?
   • Output exactly "proposal" or "non-proposal" plus a 0-1 confidence score.
2. Executive summary — ≤ 120 words, bullet style, plain English.
3. Suggestions — up to 5 numbered fixes that would strengthen the document.

Respond in the following single JSON block and nothing else:

{{
  "verdict": "<proposal | non-proposal>",
  "confidence": 0.<2 decimals>,
  "summary": "<bullet summary>",
  "suggestions": ["<text>", ...]
}}
"""

    try:
        response = query_ollama(prompt)
        
        # Try to extract JSON from response
        if response and '{' in response:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            json_str = response[json_start:json_end]
            
            result = json.loads(json_str)
            return result
        else:
            # Fallback analysis
            is_proposal = any(keyword in text_content.lower() for keyword in 
                            ['proposal', 'request for proposal', 'rfp', 'bid', 'tender'])
            
            return {
                "verdict": "proposal" if is_proposal else "non-proposal",
                "confidence": 0.70 if is_proposal else 0.60,
                "summary": "Document analysis completed with keyword detection method.",
                "suggestions": ["Consider adding more structured sections", "Include clear objectives", "Add timeline details"]
            }
            
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        return {
            "verdict": "non-proposal",
            "confidence": 0.50,
            "summary": "Unable to complete full AI analysis.",
            "suggestions": ["Document requires manual review"]
        }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "models_loaded": ocr is not None})

@app.route('/process_document', methods=['POST'])
def process_document():
    """Process uploaded document with OCR and AI analysis"""
    global faiss_index, document_chunks
    
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        job_id = request.form.get('job_id', 'unknown')
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp_file:
            file.save(tmp_file.name)
            
            # Extract text using OCR
            extracted_data = extract_text_from_image(tmp_file.name)
            
            # Combine all text
            full_text = ' '.join([item['text'] for item in extracted_data])
            
            # Create text chunks for FAISS
            document_chunks = chunk_text(full_text)
            
            # Create FAISS index
            if document_chunks:
                faiss_index, _ = create_faiss_index(document_chunks)
            
            # AI analysis
            ai_analysis = analyze_document_with_ai(full_text, file.filename)
            
            # Clean up temp file
            os.unlink(tmp_file.name)
            
            return jsonify({
                "job_id": job_id,
                "text_extracted": len(full_text) > 0,
                "total_chunks": len(document_chunks),
                "ai_analysis": ai_analysis,
                "ocr_confidence": np.mean([item['confidence'] for item in extracted_data]) if extracted_data else 0
            })
            
    except Exception as e:
        logger.error(f"Document processing error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/query_document', methods=['POST'])
def query_document():
    """Answer questions about the processed document"""
    global faiss_index, document_chunks, embedding_model
    
    try:
        data = request.get_json()
        question = data.get('question', '')
        
        if not question:
            return jsonify({"error": "No question provided"}), 400
        
        if faiss_index is None or not document_chunks:
            return jsonify({"error": "No document processed yet"}), 400
        
        # Find relevant chunks using FAISS
        question_embedding = embedding_model.encode([question])
        question_embedding = np.array(question_embedding).astype('float32')
        faiss.normalize_L2(question_embedding)
        
        # Search for top 5 most relevant chunks
        scores, indices = faiss_index.search(question_embedding, min(5, len(document_chunks)))
        
        relevant_chunks = []
        for i, idx in enumerate(indices[0]):
            if idx < len(document_chunks) and scores[0][i] > 0.3:  # Similarity threshold
                relevant_chunks.append({
                    "text": document_chunks[idx],
                    "similarity": float(scores[0][i]),
                    "chunk_id": int(idx)
                })
        
        # Create context for AI
        context = '\n'.join([chunk['text'] for chunk in relevant_chunks[:3]])
        
        # Query Ollama for answer
        prompt = f"""
SYSTEM: You are a helpful document analysis assistant. Answer the question based only on the provided context from the document. If the context doesn't contain relevant information, say "I don't have enough information in the document to answer that question."

CONTEXT:
{context}

QUESTION: {question}

Please provide a clear, concise answer based on the document content:
"""

        ai_response = query_ollama(prompt)
        
        return jsonify({
            "answer": ai_response,
            "relevant_chunks": relevant_chunks,
            "context_used": len(relevant_chunks)
        })
        
    except Exception as e:
        logger.error(f"Query processing error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting AI Document Analysis Service...")
    initialize_models()
    app.run(host='0.0.0.0', port=5001, debug=True)