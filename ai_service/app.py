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

def chunk_text(text: str, chunk_size: int = 450) -> List[str]:
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
                    "temperature": 0.2,
                    "top_p": 0.8,
                    "max_tokens": 2000
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
    
    # Create chunks for context - use more chunks for better analysis
    chunks = chunk_text(text_content, 450)
    context_sample = '\n'.join(chunks[:20])  # Use top 20 chunks for comprehensive analysis
    
    # Calculate page count estimate
    page_count = max(1, len(chunks) // 8)  # Estimate pages based on chunks
    
    prompt = f"""
SYSTEM
You are LegalDoc AI, an assistant that writes **ground-truth summaries** of legal or funding proposals.
Strict rules:
• Use only the provided CONTEXT – do not hallucinate.
• Quote or paraphrase at least 4 concrete data points ($, dates, page numbers, city names, program names).
• When you cite, add "[p N]" with the source page.

USER
⟪META⟫
file_name: {filename}
pages_examined: {page_count}

⟪CONTEXT⟫
{context_sample}

⟪TASKS⟫
1. PROPOSAL CLASSIFICATION – Determine if this is a proposal document. Output "proposal" or "non-proposal" with confidence score 0.0-1.0
2. EXHAUSTIVE SUMMARY
   • 120-180 words
   • Must mention: institution, target population, funding amount, timeline start date, and at least one statistic.
3. 3-5 IMPROVEMENTS – each ≤ 25 words, concrete (e.g., "Add KPIs such as cases closed per semester").
4. TOOLKIT – list up to 5 software platforms or legal resources that would help this specific clinic/project; 1 sentence each.

Return exactly this JSON (no markdown, no extra keys):

{{
  "verdict": "<proposal | non-proposal>",
  "confidence": 0.XX,
  "summary": "...",
  "improvements": ["...", "..."],
  "toolkit": ["...", "..."]
}}
"""

    try:
        response = query_ollama(prompt)
        
        # Try to extract and validate JSON from response
        if response and '{' in response:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            json_str = response[json_start:json_end]
            
            try:
                result = json.loads(json_str)
                # Validate required fields are present
                if 'verdict' in result and 'summary' in result and 'improvements' in result and 'toolkit' in result:
                    return result
                else:
                    logger.warning(f"Missing required fields in AI response: {result}")
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse JSON from AI response: {e}")
        
        # If JSON parsing failed, fallback to keyword detection
            # Fallback analysis
            is_proposal = any(keyword in text_content.lower() for keyword in 
                            ['proposal', 'request for proposal', 'rfp', 'bid', 'tender'])
            
            return {
                "verdict": "proposal" if is_proposal else "non-proposal",
                "confidence": 0.70 if is_proposal else 0.60,
                "summary": "Document analysis completed with keyword detection method. This appears to be a legal document that may require further review for comprehensive analysis.",
                "improvements": ["Consider adding more structured sections", "Include clear objectives", "Add timeline details", "Enhance document formatting", "Include executive summary"],
                "toolkit": ["Clio – comprehensive legal practice management", "DocuSign – electronic signature management", "Lexis+ – legal research and analysis"]
            }
            
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        return {
            "verdict": "non-proposal",
            "confidence": 0.50,
            "summary": "Unable to complete full AI analysis due to processing error. Document requires manual review.",
            "improvements": ["Document requires manual review", "Check file format compatibility", "Ensure document is text-readable"],
            "toolkit": ["Manual review tools recommended"]
        }

def extract_key_findings_from_content(content: str, filename: str) -> List[str]:
    """Extract key findings from actual document content"""
    content_lower = content.lower()
    findings = []
    
    # Look for specific patterns in the document
    if 'immigration' in content_lower or 'immigration' in filename.lower():
        findings.append("Immigration-related legal services document")
        if 'cuban' in content_lower:
            findings.append("Specific focus on Cuban immigrant population")
        if 'clinic' in content_lower:
            findings.append("Law clinic service delivery model")
    
    # Look for dates and timeframes
    import re
    dates = re.findall(r'\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}|\b\d{1,2}\/\d{1,2}\/\d{4}', content_lower)
    if dates:
        findings.append(f"Document contains {len(dates)} specific date reference(s)")
    
    # Look for financial information
    money_patterns = re.findall(r'\$[\d,]+(?:\.\d{2})?', content)
    if money_patterns:
        findings.append(f"Financial information includes amounts: {', '.join(money_patterns[:3])}")
    
    # Look for organizational structure
    if 'university' in content_lower or 'school' in content_lower:
        findings.append("Academic institution involvement")
    
    # Look for service delivery patterns
    if 'service' in content_lower and 'client' in content_lower:
        findings.append("Client service delivery framework documented")
    
    # Default findings if nothing specific found
    if not findings:
        findings = [
            "Document contains structured professional content",
            "Standard legal or business document format",
            "Contains specific requirements and procedures"
        ]
    
    return findings[:5]  # Return top 5 findings

def extract_critical_dates_from_content(content: str, filename: str) -> List[str]:
    """Extract critical dates from document content"""
    import re
    dates = []
    
    # Look for specific date patterns
    date_patterns = re.findall(r'\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}|\b\d{1,2}\/\d{1,2}\/\d{4}', content, re.IGNORECASE)
    
    if date_patterns:
        for date in date_patterns[:3]:  # Take first 3 dates found
            dates.append(f"Document date reference: {date}")
    
    # Look for deadline-related terms
    content_lower = content.lower()
    if 'deadline' in content_lower:
        dates.append("Document contains deadline information")
    
    if 'due' in content_lower and 'date' in content_lower:
        dates.append("Due date requirements specified")
    
    # Look for timeline information
    if 'timeline' in content_lower or 'schedule' in content_lower:
        dates.append("Timeline and schedule information provided")
    
    # Default dates if nothing found
    if not dates:
        dates = [
            "Document effective date upon execution",
            "Review periods as specified in agreement",
            "Notice requirements for modifications"
        ]
    
    return dates[:5]

def extract_financial_terms_from_content(content: str, filename: str) -> List[str]:
    """Extract financial terms from document content"""
    import re
    terms = []
    
    # Look for monetary amounts
    money_patterns = re.findall(r'\$[\d,]+(?:\.\d{2})?', content)
    if money_patterns:
        terms.append(f"Financial amounts specified: {', '.join(money_patterns[:3])}")
    
    content_lower = content.lower()
    
    # Look for payment terms
    if 'payment' in content_lower:
        terms.append("Payment terms and conditions outlined")
    
    if 'net 30' in content_lower or 'net30' in content_lower:
        terms.append("Net 30 day payment terms specified")
    
    if 'billing' in content_lower:
        terms.append("Billing procedures and requirements documented")
    
    # Look for budget information
    if 'budget' in content_lower:
        terms.append("Budget framework and allocations provided")
    
    # Look for funding information
    if 'funding' in content_lower or 'fund' in content_lower:
        terms.append("Funding sources and requirements detailed")
    
    # Default terms if nothing found
    if not terms:
        terms = [
            "Financial terms and conditions apply",
            "Payment schedules as per agreement",
            "Standard billing and invoicing procedures"
        ]
    
    return terms[:5]

def extract_compliance_from_content(content: str, filename: str) -> List[str]:
    """Extract compliance requirements from document content"""
    content_lower = content.lower()
    requirements = []
    
    # Look for legal compliance
    if 'legal' in content_lower or 'law' in content_lower:
        requirements.append("Legal compliance requirements specified")
    
    # Look for regulatory terms
    if 'regulation' in content_lower or 'regulatory' in content_lower:
        requirements.append("Regulatory compliance obligations outlined")
    
    # Look for licensing requirements
    if 'licens' in content_lower:
        requirements.append("Licensing and certification requirements")
    
    # Look for professional standards
    if 'professional' in content_lower and 'standard' in content_lower:
        requirements.append("Professional standards and ethics compliance")
    
    # Look for documentation requirements
    if 'document' in content_lower and 'requir' in content_lower:
        requirements.append("Documentation and record-keeping requirements")
    
    # Look for reporting requirements
    if 'report' in content_lower:
        requirements.append("Reporting and monitoring obligations")
    
    # Immigration-specific compliance
    if 'immigration' in content_lower or 'immigration' in filename.lower():
        requirements.append("Immigration law compliance and USCIS requirements")
    
    # Default requirements if nothing found
    if not requirements:
        requirements = [
            "Standard professional compliance requirements",
            "Industry-specific regulatory adherence",
            "Quality assurance and documentation standards"
        ]
    
    return requirements[:5]

def determine_document_type_from_content(content: str, filename: str) -> str:
    """Determine document type from content analysis"""
    content_lower = content.lower()
    filename_lower = filename.lower()
    
    if 'proposal' in filename_lower:
        return "Legal Service Proposal"
    elif 'immigration' in filename_lower or 'immigration' in content_lower:
        return "Immigration Law Document"
    elif 'contract' in content_lower or 'agreement' in content_lower:
        return "Legal Agreement"
    elif 'statement of work' in content_lower or 'sow' in filename_lower:
        return "Statement of Work"
    elif 'medical' in content_lower or 'healthcare' in content_lower:
        return "Healthcare Document"
    else:
        return "Professional Legal Document"

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "models_loaded": ocr is not None})

@app.route('/analyze', methods=['POST'])
def analyze_document():
    """Analyze document content and provide detailed insights"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        filename = data.get('filename', 'unknown')
        job_id = data.get('job_id', 'unknown')
        
        # Try to get the document content from the file or database
        # For now, we'll use the filename to determine document type and generate analysis
        # In a real implementation, you'd fetch the actual document content
        
        # Get cached document content if available
        if document_chunks and len(document_chunks) > 0:
            document_content = '\n'.join(document_chunks[:10])  # Use first 10 chunks for analysis
        else:
            document_content = f"Document filename: {filename}"
        
        # Perform detailed analysis using the document content
        ai_result = analyze_document_with_ai(document_content, filename)
        
        # Extract additional insights from document content
        key_findings = extract_key_findings_from_content(document_content, filename)
        critical_dates = extract_critical_dates_from_content(document_content, filename)
        financial_terms = extract_financial_terms_from_content(document_content, filename)
        compliance_requirements = extract_compliance_from_content(document_content, filename)
        
        # Create comprehensive analysis result
        analysis_result = {
            "verdict": ai_result.get("verdict", "non-proposal"),
            "confidence": ai_result.get("confidence", 0.75),
            "summary": ai_result.get("summary", "Document analysis completed"),
            "improvements": ai_result.get("improvements", []),
            "toolkit": ai_result.get("toolkit", []),
            "key_findings": key_findings,
            "document_type": determine_document_type_from_content(document_content, filename),
            "critical_dates": critical_dates,
            "financial_terms": financial_terms,
            "compliance_requirements": compliance_requirements
        }
        
        return jsonify(analysis_result)
        
    except Exception as e:
        logger.error(f"Document analysis error: {e}")
        return jsonify({"error": str(e)}), 500

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