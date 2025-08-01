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
DEFAULT_MODEL = "mistral:latest"

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
               # "stream": False,
                "options": {
                    "num_predict": max_tokens,
                    "temperature": 0.7,
                    "top_p": 0.9
                }
            }
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=600
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('response', '').strip()
            else:
                logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"Request to Ollama failed: {e}")
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

def chunk_text(text: str, max_chunk_size: int = 4000) -> List[str]:
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
    """Health check endpoint"""
    ollama_status = ollama.is_available()
    models = ollama.list_models() if ollama_status else []
    
    return jsonify({
        "status": "healthy" if ollama_status else "degraded",
        "ollama_available": ollama_status,
        "ollama_host": OLLAMA_HOST,
        "available_models": models,
        "default_model": DEFAULT_MODEL
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
        chunks = chunk_text(text, 4000)
        summaries = []
        
        for i, chunk in enumerate(chunks):
            prompt = f"""Summarize this legal document excerpt concisely:

{chunk}

Summary:"""
            
            summary = ollama.generate(model, prompt, max_tokens)
            
            if summary:
                summaries.append({
                    "chunk": i + 1,
                    "summary": summary,
                    "word_count": len(chunk.split())
                })
            else:
                summaries.append({
                    "chunk": i + 1,
                    "summary": f"Failed to generate summary for chunk {i+1}",
                    "word_count": len(chunk.split()),
                    "error": True
                })
        
        # Generate overall summary if multiple chunks
        if len(chunks) > 1:
            combined_summaries = "\n\n".join([s["summary"] for s in summaries if not s.get("error")])
            
            overall_prompt = f"""Combine these summaries into a single, coherent summary:

{combined_summaries}

Overall Summary:"""
            
            overall_summary = ollama.generate(model, overall_prompt, max_tokens)
        else:
            overall_summary = summaries[0]["summary"] if summaries else "No summary generated"
        
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
        custom_prompt = data.get('prompt')  # ✅ Accept frontend prompt if provided
        
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
        
        # ✅ Use frontend-provided prompt if available
        if custom_prompt:
            prompt = custom_prompt
        elif analysis_type == 'proposal':
            prompt = f"""Analyze this document to determine if it's a proposal and provide detailed analysis:

Document filename: {filename}

{text[:4000]}

Please analyze:
1. Is this a proposal? (Yes/No with confidence %)
2. If yes, what type of proposal?
3. Key elements that indicate it's a proposal
4. Main objectives and goals
5. Target audience
6. Strengths and areas for improvement

Analysis:"""
        else:
            prompt = f"""Provide a comprehensive legal document analysis:

Document filename: {filename}

{text[:4000]}

Please analyze:
1. Document type and category
2. Legal significance
3. Key parties and stakeholders
4. Important dates and deadlines
5. Critical requirements
6. Potential risks or concerns
7. Recommendations

Analysis:"""
        
        analysis = ollama.generate(model, prompt, 800)
        
        if not analysis:
            return jsonify({
                "error": "Analysis generation failed",
                "reason": "AI model did not return a response"
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
        response = ollama.generate(model, warmup_prompt, 50)
        
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
