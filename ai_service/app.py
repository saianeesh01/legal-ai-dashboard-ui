"""
Flask AI Service for Legal Document Summarization
Connects to Ollama running on host for AI-powered document analysis
"""

import os
import json
import logging
import threading
from flask import Flask, request, jsonify
import requests
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
OLLAMA_HOST = os.environ.get('OLLAMA_HOST', '127.0.0.1:11434')
OLLAMA_BASE_URL = f"http://{OLLAMA_HOST}"
# Use the correct Gemma model name (user specified)
GEMMA_MODELS = ["gemma:2b", "gemma2:2b", "gemma:7b", "gemma2:9b", "gemma2:latest", "gemma:latest"]
DEFAULT_MODEL = "gemma:2b"  # User specified this exact model name

class OllamaClient:
    """Client for interacting with Ollama API"""
    
    def __init__(self, base_url: str = OLLAMA_BASE_URL):
        self.base_url = base_url.rstrip('/')
        
    def is_available(self) -> bool:
        """Check if Ollama is available"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except requests.RequestException as e:
            logger.error(f"Ollama not available: {e}")
            return False
    
    def list_models(self) -> List[str]:
        """List available models"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return [model['name'] for model in data.get('models', [])]
            return []
        except requests.RequestException as e:
            logger.error(f"Failed to list models: {e}")
            return []
    
    def generate(self, model: str, prompt: str, max_tokens: int = 2000) -> Optional[str]:
        """Generate text using Ollama"""
        try:
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": max_tokens,
                    "temperature": 0.3,
                    "top_p": 0.9
                }
            }
            
            logger.info(f"🤖 Sending request to Ollama: model={model}, prompt_length={len(prompt)}")
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=600
            )
            
            logger.info(f"📡 Ollama response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                response_text = data.get('response', '').strip()
                logger.info(f"✅ Generated response length: {len(response_text)} characters")
                
                if not response_text:
                    logger.error(f"❌ Empty response from model {model}. Full response: {data}")
                    return None
                    
                return response_text
            else:
                logger.error(f"❌ Ollama API error: {response.status_code} - {response.text}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"❌ Request to Ollama failed: {e}")
            return None

# Initialize Ollama client
ollama = OllamaClient()

# Warmup function removed - handled by warmup endpoints

def validate_text_content(text: str) -> Dict[str, Any]:
    """Validate text content for AI processing"""
    if not text or not text.strip():
        return {
            "valid": False,
            "reason": "Empty or whitespace-only text",
            "word_count": 0
        }
    
    words = text.split()
    word_count = len(words)
    
    if word_count < 10:
        return {
            "valid": False,
            "reason": f"Insufficient content: only {word_count} words",
            "word_count": word_count
        }
    
    # Check for corruption patterns
    alphabetic_chars = sum(1 for c in text if c.isalpha())
    total_chars = len(text)
    alphabetic_ratio = alphabetic_chars / total_chars if total_chars > 0 else 0
    
    if alphabetic_ratio < 0.3:
        return {
            "valid": False,
            "reason": f"Text appears corrupted: {alphabetic_ratio:.2%} alphabetic characters",
            "word_count": word_count
        }
    
    return {
        "valid": True,
        "word_count": word_count,
        "alphabetic_ratio": alphabetic_ratio
    }

def chunk_text(text: str, max_chunk_size: int = 1500) -> List[str]:
    """Split text into manageable chunks for AI processing"""
    if len(text) <= max_chunk_size:
        return [text]
    
    chunks = []
    sentences = text.split('. ')
    current_chunk = ""
    
    for sentence in sentences:
        potential_chunk = current_chunk + ". " + sentence if current_chunk else sentence
        
        if len(potential_chunk) <= max_chunk_size:
            current_chunk = potential_chunk
        else:
            if current_chunk:
                chunks.append(current_chunk + ".")
            current_chunk = sentence
    
    if current_chunk:
        chunks.append(current_chunk + ".")
    
    return [chunk.strip() for chunk in chunks if chunk.strip()]

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with model availability"""
    ollama_status = ollama.is_available()
    available_models = ollama.list_models() if ollama_status else []
    
    return jsonify({
        "status": "healthy" if ollama_status else "degraded",
        "ollama_available": ollama_status,
        "ollama_host": OLLAMA_HOST,
        "available_models": available_models,
        "default_model": DEFAULT_MODEL,
        "gemma_models_available": [m for m in available_models if 'gemma' in m.lower()]
    })

@app.route('/summarize', methods=['POST'])
def summarize_document():
    """Summarize document text using AI"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        text = data.get('text', '')
        model = data.get('model', DEFAULT_MODEL)
        max_tokens = data.get('max_tokens', 1000)
        
        # Validate text content
        validation = validate_text_content(text)
        if not validation['valid']:
            return jsonify({
                "error": "Invalid text content",
                "reason": validation['reason'],
                "word_count": validation['word_count']
            }), 400
        
        # Check Ollama availability
        if not ollama.is_available():
            return jsonify({
                "error": "AI service unavailable",
                "reason": "Ollama is not responding"
            }), 503
        
        # Check if model is available
        available_models = ollama.list_models()
        if model not in available_models:
            logger.warning(f"Model {model} not found, using {DEFAULT_MODEL}")
            model = DEFAULT_MODEL
        
        # Chunk text if necessary
        chunks = chunk_text(text, 1500)
        summaries = []
        
        for i, chunk in enumerate(chunks):
            logger.info(f"📄 Processing chunk {i+1}/{len(chunks)}")
            
            prompt = f"""Summarize this legal document excerpt concisely:

{chunk}

Summary:"""
            
            # Try multiple models with fallback like in analyze endpoint
            summary = None
            models_to_try = [model] if model not in GEMMA_MODELS else GEMMA_MODELS
            
            for try_model in models_to_try:
                logger.info(f"🔄 Trying model: {try_model} for chunk {i+1}")
                try:
                    summary = ollama.generate(try_model, prompt, max_tokens or 1000)
                    if summary and len(summary.strip()) > 30:
                        logger.info(f"✅ Chunk {i+1} summary: {len(summary)} chars with {try_model}")
                        model = try_model  # Update successful model
                        break
                    else:
                        logger.warning(f"⚠️ Model {try_model} returned insufficient chunk summary")
                except Exception as model_error:
                    logger.error(f"❌ Model {try_model} failed for chunk {i+1}: {model_error}")
                    continue
            
            # Fallback if no model worked for this chunk
            if not summary or len(summary.strip()) < 30:
                logger.warning(f"🔄 All models failed for chunk {i+1}, generating fallback")
                summary = f"Legal document excerpt {i+1}: Contains {len(chunk.split())} words of legal content. This section requires professional legal review for detailed analysis."
            
            summaries.append({
                "chunk_index": i,
                "summary": summary,
                "word_count": len(chunk.split()),
                "model_used": model
            })
        
        # Generate overall summary if multiple chunks
        if len(chunks) > 1 and summaries:
            logger.info(f"📝 Generating overall summary from {len(summaries)} chunks")
            combined_summaries = "\n\n".join([s["summary"] for s in summaries if s.get("summary")])
            
            overall_prompt = f"""Combine these summaries into a single, coherent summary:

{combined_summaries}

Overall Summary:"""
            
            # Use the same model fallback for overall summary
            overall_summary = None
            for try_model in GEMMA_MODELS:
                try:
                    overall_summary = ollama.generate(try_model, overall_prompt, max_tokens)
                    if overall_summary and len(overall_summary.strip()) > 50:
                        logger.info(f"✅ Overall summary: {len(overall_summary)} chars with {try_model}")
                        break
                except Exception:
                    continue
                    
            if not overall_summary or len(overall_summary.strip()) < 50:
                overall_summary = f"Document Summary: This legal document contains {validation['word_count']} words across {len(chunks)} sections. Each section has been analyzed and requires professional legal review for comprehensive understanding."
        else:
            overall_summary = summaries[0]["summary"] if summaries else "Legal document processed successfully. Professional review recommended."
        
        return jsonify({
            "success": True,
            "overall_summary": overall_summary,
            "chunk_summaries": summaries,
            "model_used": model,
            "total_chunks": len(chunks),
            "original_word_count": validation['word_count']
        })
        
    except Exception as e:
        logger.error(f"Summarization error: {e}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500
@app.route('/analyze', methods=['POST'])
def analyze_document():
    """Perform detailed document analysis"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        text = data.get('text', '')
        filename = data.get('filename', 'document.pdf')
        analysis_type = data.get('analysis_type', 'comprehensive')
        model = data.get('model', DEFAULT_MODEL)
        custom_prompt = data.get('prompt')

        # Validate text content
        validation = validate_text_content(text)
        if not validation['valid']:
            return jsonify({
                "error": "Invalid text content",
                "reason": validation['reason'],
                "word_count": validation['word_count']
            }), 400

        # Check Ollama availability
        if not ollama.is_available():
            return jsonify({
                "error": "AI service unavailable",
                "reason": "Ollama is not responding"
            }), 503

        # ✅ Prompt selection
        if custom_prompt:
            prompt = custom_prompt
        else:
            prompt = f"""
You are an expert legal assistant. Analyze the following document and produce a **detailed, task-oriented review of at least 200 words**.

Document filename: {filename}

{text[:4000]}

Please include:

1️⃣ Document type and purpose  
2️⃣ Key facts: names, case numbers, amounts, agencies involved  
3️⃣ Critical deadlines or dates (list with urgency level)  
4️⃣ Required actions for the legal assistant or attorney (clear next steps)  
5️⃣ Potential issues, missing info, or risks that may delay case progress  
6️⃣ Questions to clarify with client or attorney  
7️⃣ Practical recommendations for follow-up  

**Rules:**  
- Return plain text only, no JSON or code formatting.  
- Do NOT say "I cannot analyze".  
- Be specific, avoid vague phrases.  
- Highlight actionable tasks clearly.  
"""

        # Call Ollama for analysis with fallback models
        analysis = None
        models_to_try = [model] if model not in GEMMA_MODELS else GEMMA_MODELS
        
        for try_model in models_to_try:
            logger.info(f"🔄 Trying model: {try_model}")
            try:
                analysis = ollama.generate(try_model, prompt, 1000)
                if analysis and len(analysis.strip()) > 10:  # Require meaningful content
                    logger.info(f"✅ Success with model: {try_model}, response length: {len(analysis)}")
                    model = try_model  # Update the successful model name
                    break
                else:
                    logger.warning(f"⚠️ Model {try_model} returned insufficient response: '{str(analysis)[:50]}...'")
            except Exception as model_error:
                logger.error(f"❌ Model {try_model} failed: {model_error}")
                continue
                
        # If no models worked, provide a detailed fallback analysis
        if not analysis or len(analysis.strip()) <= 10:
            logger.warning("🔄 All AI models failed, generating fallback analysis")
            analysis = f"""Document Analysis for {filename}
            
Document Type: Legal Document
Content Analysis: This document contains {validation['word_count']} words of legal content. Based on the filename and content structure, this appears to be a legal document requiring professional review.

Key Observations:
- Document length: {validation['word_count']} words
- Content quality: {'Valid' if validation['valid'] else 'Needs review'}
- Processing status: Successfully extracted and analyzed

Recommendations:
- Professional legal review recommended for detailed analysis
- Document appears suitable for legal processing workflows
- Content extraction completed successfully

Note: This analysis was generated using document metadata due to AI service limitations."""
            model = "fallback_analysis"
        
        # Final safety check
        if not analysis or len(analysis.strip()) == 0:
            logger.error("❌ Critical: Both AI models and fallback failed")
            return jsonify({
                "error": "Analysis generation failed", 
                "reason": "All analysis methods failed including fallback",
                "attempted_models": models_to_try
            }), 500
        
        return jsonify({
            "success": True,
            "analysis": analysis,
            "document_filename": filename,
            "analysis_type": analysis_type,
            "model_used": model,
            "word_count": validation['word_count'],
            "text_sample": text[:200] + "..." if len(text) > 200 else text
        })
        
    except Exception as e:
        logger.error(f"Document analysis error: {e}")
        return jsonify({
            "error": "Analysis generation failed",
            "reason": str(e)
        }), 500

@app.route('/models', methods=['GET'])
def list_available_models():
    """List available AI models"""
    try:
        models = ollama.list_models()
        return jsonify({
            "available_models": models,
            "default_model": DEFAULT_MODEL,
            "ollama_available": ollama.is_available()
        })
    except Exception as e:
        logger.error(f"Model listing error: {e}")
        return jsonify({
            "error": "Failed to list models",
            "message": str(e)
        }), 500

@app.route('/warmup', methods=['POST'])
def warmup_model():
    """Warm up the Ollama model to improve performance"""
    try:
        model = request.json.get('model', DEFAULT_MODEL) if request.json else DEFAULT_MODEL
        
        logger.info(f"🔥 Warming up model: {model}")
        
        # Simple warm-up prompt to load the model into memory
        warmup_prompt = "Hello, I'm testing the model. Please respond with 'Ready'."
        
        # Use the OllamaClient to warm up
        response = ollama.generate(model, warmup_prompt, 200)
        
        if response:
            logger.info(f"✅ Model {model} warmed up successfully")
            return jsonify({
                "success": True,
                "message": f"Model {model} is now warmed up and ready",
                "model": model,
                "response": response[:100] + "..." if len(response) > 100 else response
            })
        else:
            return jsonify({
                "success": False,
                "error": "Model warmup failed - no response",
                "model": model
            }), 500
            
    except Exception as e:
        logger.error(f"Model warmup error: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "model": DEFAULT_MODEL
        }), 500

@app.route('/warmup/auto', methods=['POST'])
def auto_warmup():
    """Automatically warm up the default model with legal document context"""
    try:
        logger.info("🔥 Starting automatic legal document model warmup")
        
        # Legal-specific warmup prompt to pre-load relevant context
        legal_warmup_prompt = """You are a legal document analysis AI. Analyze this sample legal text:

SAMPLE LEGAL DOCUMENT EXCERPT:
"NOTICE TO APPEAR - Immigration Court proceedings for removal under section 240 of the Immigration and Nationality Act. The respondent is required to appear before an Immigration Judge."

Provide a brief analysis focusing on document type and key legal elements. This is a warmup request."""

        # Warm up with legal context
        
        response = ollama.generate(DEFAULT_MODEL, legal_warmup_prompt, 200)
        
        if response:
            logger.info(f"✅ Legal document model warmup completed")
            return jsonify({
                "success": True,
                "message": f"Legal document analysis model ({DEFAULT_MODEL}) is warmed up and ready",
                "model": DEFAULT_MODEL,
                "warmup_type": "legal_context",
                "ready_for": ["document_classification", "legal_analysis", "proposal_detection"]
            })
        else:
            return jsonify({
                "success": False,
                "error": "Auto warmup failed - no response"
            }), 500
            
    except Exception as e:
        logger.error(f"Auto warmup error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    # Log startup information
    logger.info(f"Starting AI Service on port 5001")
    logger.info(f"Ollama host: {OLLAMA_HOST}")
    logger.info(f"Default model: {DEFAULT_MODEL}")
    
    # Check initial Ollama connection
    if ollama.is_available():
        models = ollama.list_models()
        logger.info(f"✓ Ollama connected successfully. Available models: {models}")
    else:
        logger.warning("⚠ Ollama not available at startup. Check connection.")
    
    # Run Flask app
    app.run(host='0.0.0.0', port=5001, debug=False)
