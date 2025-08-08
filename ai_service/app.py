"""
Flask AI Service for Legal Document Summarization
Connects to Ollama running on host for AI-powered document analysis
"""

import os
import json
import logging
import threading
import re
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor, as_completed
from flask import Flask, request, jsonify
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from typing import Dict, List, Any, Optional

# Import FAISS vector search
from vector_search import vector_engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration with CPU optimizations
OLLAMA_HOST = os.environ.get('OLLAMA_HOST', '127.0.0.1:11434')
OLLAMA_BASE_URL = f"http://{OLLAMA_HOST}"
OLLAMA_NUM_PARALLEL = int(os.environ.get('OLLAMA_NUM_PARALLEL', '2'))  # ✅ CPU optimization
OLLAMA_CONTEXT_LENGTH = int(os.environ.get('OLLAMA_CONTEXT_LENGTH', '1024'))  # ✅ Reduced context
MAX_TOKENS_PER_REQUEST = int(os.environ.get('MAX_TOKENS_PER_REQUEST', '300'))  # ✅ Token limit
DEFAULT_MODEL = os.environ.get('DEFAULT_MODEL', 'mistral:7b-instruct-q4_0')  # ✅ Optimized model

# Use the correct Gemma model name (user specified)
GEMMA_MODELS = ["gemma:2b", "gemma2:2b", "gemma:7b", "gemma2:9b", "gemma2:latest", "gemma:latest"]

class OllamaClient:
    """Client for interacting with Ollama API with connection pooling"""
    
    def __init__(self, base_url: str = OLLAMA_BASE_URL):
        self.base_url = base_url.rstrip('/')
        
        # 🚀 Create session with connection pooling for faster communication
        self.session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[500, 502, 503, 504]
        )
        
        # Configure adapter with connection pooling
        adapter = HTTPAdapter(
            pool_connections=10,  # Number of connection pools
            pool_maxsize=20,      # Maximum number of connections in pool
            max_retries=retry_strategy
        )
        
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Set keep-alive headers
        self.session.headers.update({
            'Connection': 'keep-alive',
            'Keep-Alive': 'timeout=300, max=1000'
        })
        
    def is_available(self) -> bool:
        """Check if Ollama is available"""
        try:
            response = self.session.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except requests.RequestException as e:
            logger.error(f"Ollama not available: {e}")
            return False
    
    def list_models(self) -> List[str]:
        """List available models"""
        try:
            response = self.session.get(f"{self.base_url}/api/tags", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return [model['name'] for model in data.get('models', [])]
            return []
        except requests.RequestException as e:
            logger.error(f"Failed to list models: {e}")
            return []
    
    def generate(self, model: str, prompt: str, max_tokens: int = None) -> Optional[str]:
        """Generate text using Ollama with CPU optimizations and connection pooling"""
        if max_tokens is None:
            max_tokens = MAX_TOKENS_PER_REQUEST
            
        try:
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": max_tokens,
                    "temperature": 0.3,
                    "top_p": 0.9,
                    "num_parallel": OLLAMA_NUM_PARALLEL,  # ✅ CPU optimization
                    "keep_alive": "5m"  # 🚀 Keep model in memory
                }
            }
            
            logger.info(f"🤖 Sending request to Ollama: model={model}, prompt_length={len(prompt)}")
            
            response = self.session.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=1800  # ✅ Increased timeout to 30 minutes for large documents
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
    
    async def generate_async(self, model: str, prompt: str, max_tokens: int = None) -> Optional[str]:
        """Async version of generate for parallel processing"""
        if max_tokens is None:
            max_tokens = MAX_TOKENS_PER_REQUEST
            
        try:
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": max_tokens,
                    "temperature": 0.3,
                    "top_p": 0.9,
                    "num_parallel": OLLAMA_NUM_PARALLEL,
                    "keep_alive": "5m"
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=1800)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get('response', '').strip()
                    else:
                        logger.error(f"❌ Async Ollama API error: {response.status}")
                        return None
                        
        except Exception as e:
            logger.error(f"❌ Async request to Ollama failed: {e}")
            return None
    
    def generate_batch(self, model: str, prompts: List[str], max_tokens: int = None) -> List[Optional[str]]:
        """Generate responses for multiple prompts in parallel using ThreadPoolExecutor"""
        if max_tokens is None:
            max_tokens = MAX_TOKENS_PER_REQUEST
            
        results = [None] * len(prompts)
        
        def process_chunk(chunk_data):
            index, prompt = chunk_data
            try:
                return index, self.generate(model, prompt, max_tokens)
            except Exception as e:
                logger.error(f"❌ Error processing chunk {index}: {e}")
                return index, None
        
        # Use ThreadPoolExecutor for parallel processing
        with ThreadPoolExecutor(max_workers=OLLAMA_NUM_PARALLEL) as executor:
            # Submit all tasks
            future_to_index = {
                executor.submit(process_chunk, (i, prompt)): i 
                for i, prompt in enumerate(prompts)
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_index):
                try:
                    index, result = future.result()
                    results[index] = result
                    logger.info(f"✅ Completed chunk {index + 1}/{len(prompts)}")
                except Exception as e:
                    logger.error(f"❌ Exception in chunk processing: {e}")
        
        return results

# Initialize Ollama client
ollama = OllamaClient()

# ✅ NLP Extractors for roadmap item 3
def extract_dates(text: str) -> List[str]:
    """Extract dates from text using regex patterns"""
    date_patterns = [
        r'\b\d{1,2}/\d{1,2}/\d{4}\b',  # dd/mm/yyyy
        r'\b\d{1,2}-\d{1,2}-\d{4}\b',  # dd-mm-yyyy
        r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b',  # Month DD, YYYY
        r'\b\d{4}-\d{1,2}-\d{1,2}\b',  # yyyy-mm-dd
    ]
    
    dates = []
    for pattern in date_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        dates.extend(matches)
    
    return list(set(dates))  # Remove duplicates

def extract_money(text: str) -> List[str]:
    """Extract monetary amounts from text"""
    money_patterns = [
        r'\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?',  # $1,234.56
        r'\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|dollars?|cents?)',  # 1,234.56 USD
        r'\d+(?:\.\d{2})?\s*%',  # 15.5%
    ]
    
    amounts = []
    for pattern in money_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        amounts.extend(matches)
    
    return list(set(amounts))

def extract_compliance_terms(text: str) -> List[str]:
    """Extract compliance-related terms"""
    compliance_keywords = [
        'compliance', 'requirement', 'timeline', 'due by', 'deadline',
        'must', 'shall', 'required', 'mandatory', 'obligation'
    ]
    
    found_terms = []
    lower_text = text.lower()
    for keyword in compliance_keywords:
        if keyword in lower_text:
            found_terms.append(keyword)
    
    return found_terms

def extract_nlp_data(text: str) -> Dict[str, List[str]]:
    """Extract all NLP data for structured prompts"""
    return {
        'dates': extract_dates(text),
        'amounts': extract_money(text),
        'compliance_terms': extract_compliance_terms(text)
    }

# ✅ Enhanced chunking for roadmap item 1
def chunk_text(text: str, max_chunk_size: int = 1500) -> List[str]:
    """Enhanced chunking with better boundaries"""
    if len(text) <= max_chunk_size:
        return [text]
    
    chunks = []
    current_chunk = ""
    
    # Split by sentences first, then by paragraphs
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) <= max_chunk_size:
            current_chunk += sentence + " "
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + " "
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks

# ✅ Enhanced prompt engineering for roadmap item 1
def create_structured_prompt(text: str, task: str, nlp_data: Dict[str, List[str]] = None) -> str:
    """Create structured prompts with context limits and anti-speculation rule"""
    # Limit context to prevent timeouts
    limited_text = text[:3000] if len(text) > 3000 else text
    
    # Build structured prompt
    prompt = f"""You are a legal document analysis AI. {task}

Document text:
{limited_text}

"""
    
    # Add extracted NLP data if available
    if nlp_data:
        prompt += f"""Extracted data:
- Dates: {', '.join(nlp_data['dates']) if nlp_data['dates'] else 'None found'}
- Amounts: {', '.join(nlp_data['amounts']) if nlp_data['amounts'] else 'None found'}
- Compliance terms: {', '.join(nlp_data['compliance_terms']) if nlp_data['compliance_terms'] else 'None found'}

"""
    
    # Add anti-speculation rule
    prompt += """IMPORTANT: You must answer based only on the document text. Do not speculate or add information not present in the document.

"""
    
    return prompt

def create_optimized_prompt(text: str, task: str = "analyze") -> str:
    """Create a simplified, fast prompt for document analysis"""
    
    # For summarization, allow larger context for comprehensive summary
    if task == "summarize":
        max_chars = 8000  # Increased for comprehensive summarization
        limited_text = text[:max_chars] + "..." if len(text) > max_chars else text
        
        return f"""You are a legal AI assistant. Create a comprehensive, unified summary of this legal document in one cohesive paragraph:

{limited_text}

Provide a detailed summary that covers:
- Main purpose and key objectives
- Critical dates, deadlines, and timelines
- Important parties, entities, or individuals mentioned
- Key financial terms, amounts, or budgetary information
- Legal requirements, compliance issues, or regulatory concerns
- Major findings, conclusions, or recommendations
- Any unique or noteworthy aspects of the document

Write as a single, flowing paragraph that captures the essence of the entire document. Be specific and include concrete details from the text."""
    
    # For other tasks, use smaller context
    max_chars = 2000
    limited_text = text[:max_chars] + "..." if len(text) > max_chars else text
    
    if task == "analyze":
        return f"""You are a legal AI assistant. Analyze this legal document and provide a structured analysis:

{limited_text}

📝 Original Summary:
[Provide a concise 2-3 sentence summary of the document's main purpose and key content]

---

🟩 Positive Developments:
• [List positive developments or resolved issues]
• [Highlight any strong legal arguments or comprehensive coverage]
• [Note any particularly clear or effective sections]

🟨 Ongoing Concerns:
• [Identify ongoing concerns that should be monitored]
• [Point out missing information or gaps in coverage]
• [Suggest areas that need improvement or clarification]

🟥 Urgent Issues:
• [List critical or urgent issues requiring immediate attention]
• [Highlight immediate action items that require attention]
• [Note any deadlines or time-sensitive matters]

---

Inconsistencies:
• [List any contradictions or discrepancies present in the document]

Missing Information:
• [Identify any areas where data, sources, or context are lacking]

Suggested Action Items:
• [Recommend next steps based on the document's findings]
• [Suggest further research, policy review, or outreach to organizations]

Format with clear sections and bullet points for easy reading."""
    
    else:
        return f"""You are a legal AI assistant. Answer this question about the document:

Question: {task}
Document: {limited_text}

Answer based only on the document content."""

def create_report_analysis_prompt(text: str) -> str:
    """Create a specialized prompt for report analysis with bullet points"""
    
    max_chars = 2000
    limited_text = text[:max_chars] + "..." if len(text) > max_chars else text
    
    return f"""You are a legal AI assistant. Analyze this report and provide improvements in bullet points:

{limited_text}

**Report Analysis:**
• **Document Type**: [Classify report type]
• **Summary**: [2-3 sentence summary]

**Areas for Improvement:**
• [List specific improvements needed]
• [Format and structure issues]
• [Content gaps or missing information]
• [Clarity and readability issues]

**Action Items:**
• [What needs to be fixed]
• [Priority items to address]

Be concise and use bullet points."""

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
    """Summarize document with comprehensive, unified prompt"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        text = data.get('text', '')
        model = data.get('model', DEFAULT_MODEL)
        max_tokens = data.get('max_tokens', 800)  # Increased for comprehensive summary
        
        if not text.strip():
            return jsonify({"error": "No text provided for summarization"}), 400
        
        # Use comprehensive prompt for unified summarization
        prompt = create_optimized_prompt(text, "summarize")
        
        logger.info(f"📝 Summarizing document with {model} (max_tokens: {max_tokens})")
        result = ollama.generate(model, prompt, max_tokens)
        
        if not result:
            result = "Unable to summarize document."
        
        return jsonify({
            "success": True,
            "summary": result,
            "model_used": model,
            "prompt_type": "comprehensive_unified"
        })
        
    except Exception as e:
        logger.error(f"Summarization error: {e}")
        return jsonify({
            "error": "Summarization failed",
            "message": str(e)
        }), 500

@app.route('/analyze', methods=['POST'])
def analyze_document():
    """Analyze document with simplified, fast prompt"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        text = data.get('text', '')
        model = data.get('model', DEFAULT_MODEL)
        max_tokens = data.get('max_tokens', MAX_TOKENS_PER_REQUEST)
        
        if not text.strip():
            return jsonify({"error": "No text provided for analysis"}), 400
        
        # Use optimized prompt for faster processing
        prompt = create_optimized_prompt(text, "analyze")
        
        logger.info(f"🔍 Analyzing document with {model}")
        result = ollama.generate(model, prompt, max_tokens)
        
        if not result:
            result = "Unable to analyze document."
        
        return jsonify({
            "success": True,
            "analysis": result,
            "model_used": model,
            "prompt_type": "optimized"
        })
        
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return jsonify({
            "error": "Analysis failed",
            "message": str(e)
        }), 500

@app.route('/analyze/report', methods=['POST'])
def analyze_report():
    """Analyze report with bullet point improvements"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        text = data.get('text', '')
        model = data.get('model', DEFAULT_MODEL)
        max_tokens = data.get('max_tokens', MAX_TOKENS_PER_REQUEST)
        
        if not text.strip():
            return jsonify({"error": "No text provided for analysis"}), 400
        
        # Use specialized report analysis prompt
        prompt = create_report_analysis_prompt(text)
        
        logger.info(f"📊 Analyzing report with {model}")
        result = ollama.generate(model, prompt, max_tokens)
        
        if not result:
            result = "Unable to analyze report."
        
        return jsonify({
            "success": True,
            "analysis": result,
            "model_used": model,
            "prompt_type": "report_analysis"
        })
        
    except Exception as e:
        logger.error(f"Report analysis error: {e}")
        return jsonify({
            "error": "Report analysis failed",
            "message": str(e)
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

@app.route('/vector/build', methods=['POST'])
def build_vector_index():
    """Build FAISS vector index from document text"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        text = data.get('text', '')
        document_id = data.get('document_id', 'unknown')
        filename = data.get('filename', 'document.pdf')
        
        if not text.strip():
            return jsonify({"error": "No text provided for indexing"}), 400
        
        # Build the vector index
        success = vector_engine.build_index(text, document_id, filename)
        
        if success:
            stats = vector_engine.get_index_stats()
            return jsonify({
                "success": True,
                "message": "Vector index built successfully",
                "stats": stats
            })
        else:
            return jsonify({
                "error": "Failed to build vector index"
            }), 500
            
    except Exception as e:
        logger.error(f"Vector index build error: {e}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route('/vector/search', methods=['POST'])
def search_vector_index():
    """Search FAISS vector index for semantically similar chunks"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        query = data.get('query', '')
        top_k = data.get('top_k', 3)
        
        if not query.strip():
            return jsonify({"error": "No query provided"}), 400
        
        # Search the vector index
        results = vector_engine.search(query, top_k)
        
        return jsonify({
            "success": True,
            "query": query,
            "results": results,
            "total_found": len(results)
        })
        
    except Exception as e:
        logger.error(f"Vector search error: {e}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route('/vector/stats', methods=['GET'])
def get_vector_stats():
    """Get FAISS vector index statistics"""
    try:
        stats = vector_engine.get_index_stats()
        return jsonify({
            "success": True,
            "stats": stats
        })
        
    except Exception as e:
        logger.error(f"Vector stats error: {e}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route('/vector/clear', methods=['POST'])
def clear_vector_index():
    """Clear FAISS vector index"""
    try:
        vector_engine.clear_index()
        return jsonify({
            "success": True,
            "message": "Vector index cleared successfully"
        })
        
    except Exception as e:
        logger.error(f"Vector clear error: {e}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route('/query/semantic', methods=['POST'])
def semantic_query():
    """Semantic query with FAISS + LLM for reduced load"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        query = data.get('query', '')
        model = data.get('model', DEFAULT_MODEL)
        max_tokens = data.get('max_tokens', MAX_TOKENS_PER_REQUEST)
        
        if not query.strip():
            return jsonify({"error": "No query provided"}), 400
        
        # Check if vector index exists
        stats = vector_engine.get_index_stats()
        if stats.get("status") != "active":
            return jsonify({
                "error": "No vector index available",
                "message": "Please build a vector index first using /vector/build"
            }), 400
        
        # Search for relevant chunks using FAISS
        logger.info(f"🔍 Performing semantic search for: '{query}'")
        search_results = vector_engine.search(query, top_k=3)
        
        if not search_results:
            return jsonify({
                "error": "No relevant content found",
                "message": "The query doesn't match any content in the indexed documents"
            }), 404
        
        # Extract relevant chunks
        relevant_chunks = [result["chunk"] for result in search_results]
        combined_context = "\n\n".join(relevant_chunks)
        
        # Create prompt with semantic search results
        prompt = f"""You are a legal AI assistant. Answer this question based ONLY on the provided excerpts:

Question: {query}

Relevant excerpts:
{combined_context}

Answer:"""
        
        # Generate answer using LLM
        logger.info(f"🤖 Generating answer using {model}")
        answer = ollama.generate(model, prompt, max_tokens)
        
        if not answer:
            answer = "Unable to generate answer based on the available content."
        
        return jsonify({
            "success": True,
            "query": query,
            "answer": answer,
            "model_used": model,
            "semantic_search_results": search_results,
            "chunks_used": len(relevant_chunks),
            "total_chunks_searched": stats.get("total_chunks", 0)
        })
        
    except Exception as e:
        logger.error(f"Semantic query error: {e}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
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
