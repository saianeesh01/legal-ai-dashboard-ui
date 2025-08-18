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
from flask_cors import CORS
from typing import List, Dict, Optional
import requests
from dataclasses import dataclass
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

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
        max_chars = 4000  # Reduced to prevent memory issues
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

def create_universal_extraction_prompt(text: str, filename: str) -> str:
    """Create the Enhanced Universal Legal-Doc Extractor prompt for comprehensive document analysis"""
    
    # Smart context selection for large documents
    if len(text) > 10000:
        # For large documents, use strategic sampling
        limited_text = smart_context_selection(text, filename)
    else:
        # For smaller documents, use full context
        max_chars = 8000
        limited_text = text[:max_chars] + "..." if len(text) > max_chars else text
    
    return f"""# Enhanced Universal Legal-Doc Extractor (Doc-Only • Multi-Type • No Hallucinations)

**You are a legal/document extraction agent. Follow these rules exactly.**

## Hard Rules

1. **Use ONLY the provided document text** (no filename cues, prior runs, or web).
2. Every item must include a **verbatim snippet** and a **page number**.
3. If a fact is not explicit in the text, **omit it**. Do **not** guess.
4. If you're unsure how to label something, return it under `other` with low confidence **or drop it**.
5. Output **valid JSON only**. No prose.

---

## Step 1 — Detect `doc_type` from content (not filename)

Choose one of:

* `court_opinion_or_order` - Court decisions, opinions, orders, judgments
* `complaint_or_docket` - Legal complaints, petitions, docket entries
* `government_form` - Official forms, applications, petitions
* `council_or_rfp` - City council memos, public notices, RFPs, board documents
* `grant_notice_or_rfa` - Grant NOFO/RFA/FOA, funding announcements, invitations
* `meeting_minutes` - Board/commission/council meeting minutes, agendas
* `procurement_sow_or_contract` - SOW, PWS, contracts, procurement documents
* `audit_or_investigation_report` - Inspector general, comptroller, audit reports
* `federal_report_to_congress` - Statute-mandated reports, annual reports to Congress
* `country_or_policy_report` - Country/human-rights reports, policy white papers
* `academic_program_or_clinic_brochure` - Law clinic brochures, program sheets, flyers
* `proposal_or_whitepaper` - Grant proposals, program proposals, white papers
* `other_legal` - Other legal documents not fitting above categories

If uncertain, choose `other_legal`.

---

## Step 2 — Top-Level JSON shape

```json
{{
  "doc_type": "string",
  "meta": {{
    "title": "string|null",
    "jurisdiction_or_body": "string|null",
    "date_iso": "YYYY-MM-DD|null",
    "page_count": 0
  }},
  "sections": {{}}
}}
```

Populate `sections` using the schema for the detected type.

---

## Document Text to Analyze:

{limited_text}

## Instructions:

Analyze this document and return ONLY a valid JSON object following the schema above. Use the exact document types and section structures specified. Include verbatim evidence and page numbers for all extracted information. Do not include any explanatory text or prose - only the JSON object."""

def smart_context_selection(text: str, filename: str) -> str:
    """Intelligently select the most relevant context from large documents"""
    
    # Strategy: Combine beginning, key sections, and end
    total_length = len(text)
    
    # Get beginning (title, header, introduction)
    beginning = text[:2000]
    
    # Get middle section (often contains key content)
    middle_start = total_length // 3
    middle_end = middle_start + 2000
    middle = text[middle_start:middle_end]
    
    # Get end (conclusions, recommendations)
    end = text[-2000:] if total_length > 4000 else ""
    
    # Look for key sections based on document type
    key_sections = []
    
    # For country reports, look for specific patterns
    if 'human rights' in filename.lower() or 'country report' in filename.lower():
        # Find sections with key indicators
        patterns = [
            r'(?:Executive Summary|Introduction|Overview).*?(?=\n\n|\n[A-Z]|$)',
            r'(?:Key Findings|Main Issues|Conclusions).*?(?=\n\n|\n[A-Z]|$)',
            r'(?:Recommendations|Action Items|Next Steps).*?(?=\n\n|\n[A-Z]|$)',
            r'(?:Department of State|Bureau of Democracy).*?(?=\n\n|\n[A-Z]|$)'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
            if matches:
                key_sections.extend(matches[:2])  # Take first 2 matches
    
    # Combine all sections
    combined = beginning + "\n\n" + middle
    
    if key_sections:
        combined += "\n\n" + "\n\n".join(key_sections)
    
    if end:
        combined += "\n\n" + end
    
    # Limit to reasonable size
    max_combined = 6000
    if len(combined) > max_combined:
        combined = combined[:max_combined] + "..."
    
    return combined

# Enable CORS
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        ollama_status = ollama.is_available()
        return jsonify({
            "status": "healthy" if ollama_status else "degraded",
            "ollama_available": ollama_status,
            "ollama_host": OLLAMA_HOST
        })
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/summarize', methods=['POST'])
def summarize_document():
    """Summarize document with comprehensive, unified prompt"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        text = data.get('text', '')
        filename = data.get('filename', 'unknown')
        model = data.get('model', DEFAULT_MODEL)
        max_tokens = data.get('max_tokens', 800)
        
        if not text.strip():
            return jsonify({"error": "No text provided for summarization"}), 400
        
        # Use comprehensive prompt for unified summarization
        prompt = create_optimized_prompt(text, "summarize")
        logger.info(f"📝 Summarizing document with {model} (max_tokens: {max_tokens})")
        
        result = ollama.generate(model, prompt, max_tokens)
        
        if not result:
            result = "Unable to process document."
        
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

@app.route('/extract/universal', methods=['POST'])
def universal_document_extraction():
    """Extract structured information using Enhanced Universal Legal-Doc Extractor prompt"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        text = data.get('text', '')
        filename = data.get('filename', 'unknown')
        model = data.get('model', DEFAULT_MODEL)
        max_tokens = data.get('max_tokens', 2000)
        
        if not text.strip():
            return jsonify({"error": "No text provided for extraction"}), 400
        
        # Create the enhanced universal extraction prompt
        prompt = create_universal_extraction_prompt(text, filename)
        
        logger.info(f"🔍 Performing enhanced universal document extraction with {model}")
        result = ollama.generate(model, prompt, max_tokens)
        
        if not result:
            return jsonify({"error": "Extraction failed - no response from AI model"}), 500
        
        # Try to parse JSON response
        try:
            parsed_result = json.loads(result)
            return jsonify({
                "success": True,
                "extraction": parsed_result,
                "raw_response": result,
                "model_used": model,
                "prompt_type": "enhanced_universal_extractor"
            })
        except json.JSONDecodeError:
            # Return raw response if JSON parsing fails
            return jsonify({
                "success": True,
                "extraction": result,
                "raw_response": result,
                "model_used": model,
                "prompt_type": "enhanced_universal_extractor",
                "warning": "Response is not valid JSON - returning raw text"
            })
        
    except Exception as e:
        logger.error(f"Enhanced universal extraction error: {e}")
        return jsonify({
            "error": "Enhanced universal extraction failed",
            "message": str(e)
        }), 500

@app.route('/extract/enhanced', methods=['POST'])
def enhanced_document_extraction():
    """Enhanced document extraction with comprehensive analysis and bullet-point formatting"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        text = data.get('text', '')
        filename = data.get('filename', 'unknown')
        model = data.get('model', DEFAULT_MODEL)
        max_tokens = data.get('max_tokens', 1500)
        
        if not text.strip():
            return jsonify({"error": "No text provided for extraction"}), 400
        
        # For large documents, use chunked processing
        if len(text) > 10000:
            logger.info(f"📄 Large document detected ({len(text)} chars), using chunked processing")
            return process_large_document_chunked(text, filename, model, max_tokens)
        
        # Create comprehensive analysis prompt with bullet points
        analysis_prompt = f"""# Enhanced Legal Document Analysis

Analyze this legal document comprehensively and provide detailed insights in a clean, bullet-point format.

**Document:** {filename}

**Content:**
{text[:3000] + "..." if len(text) > 3000 else text}

**Provide analysis in the following format:**

## 📋 Document Classification
• **Document Type:** [Classify as: Court Opinion/Order, Complaint/Docket, Government Form, Council/RFP, Grant Notice/RFA, Meeting Minutes, Procurement/SOW/Contract, Audit/Investigation Report, Federal Report to Congress, Country/Policy Report, Academic Program/Clinic Brochure, Proposal/White Paper, or Other Legal]
• **Confidence Level:** [High/Medium/Low]
• **Key Indicators:** [List specific content patterns that led to classification]

## 📅 Critical Dates & Deadlines
• [Extract and list all important dates with context]
• [Include filing deadlines, hearing dates, submission dates, etc.]

## 💰 Financial Information
• [Extract monetary amounts, budgets, funding ceilings, costs]
• [Include currency and context for each amount]

## ⚖️ Legal Requirements & Compliance
• [List all legal requirements, regulations, compliance standards]
• [Include statutory citations and regulatory references]

## 🎯 Key Findings & Decisions
• [Extract main findings, decisions, conclusions, or outcomes]
• [Include supporting evidence and reasoning]

## 📋 Parties & Entities
• [List all parties, agencies, organizations mentioned]
• [Include their roles and relationships]

## 📊 Statistics & Metrics
• [Extract any numerical data, percentages, counts]
• [Include context and significance]

## 🔍 Recommendations & Action Items
• [List any recommendations, suggestions, or required actions]
• [Include deadlines and responsible parties]

## ⚠️ Important Warnings & Notices
• [Extract any warnings, disclaimers, or important notices]
• [Include compliance requirements and consequences]

## 📝 Additional Notes
• [Any other significant information not covered above]
• [Include document-specific insights and observations]

**Instructions:**
- Use bullet points for all items
- Be specific and include exact quotes when possible
- Maintain professional legal analysis tone
- Focus on actionable insights and practical information
- Include page numbers or locations if available
- Ensure all information is directly from the document content"""
        
        logger.info(f"🔍 Performing enhanced document analysis with {model}")
        result = ollama.generate(model, analysis_prompt, max_tokens)
        
        if not result:
            return jsonify({"error": "Enhanced analysis failed - no response from AI model"}), 500
        
        return jsonify({
            "success": True,
            "analysis": result,
            "model_used": model,
            "prompt_type": "enhanced_analysis",
            "document_type": "comprehensive_legal_analysis"
        })
        
    except Exception as e:
        logger.error(f"Enhanced analysis error: {e}")
        return jsonify({
            "error": "Enhanced analysis failed",
            "message": str(e)
        }), 500

def process_large_document_chunked(text: str, filename: str, model: str, max_tokens: int):
    """Process large documents in chunks to avoid memory issues"""
    try:
        # Split text into manageable chunks
        chunk_size = 2000
        chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
        
        logger.info(f"📄 Processing {len(chunks)} chunks for large document")
        
        # Process first chunk for document classification
        classification_prompt = f"""# Document Classification

Analyze this document excerpt and classify it:

**Document:** {filename}
**Content:** {chunks[0]}

**Classify as one of:**
- Court Opinion/Order
- Complaint/Docket  
- Government Form
- Council/RFP
- Grant Notice/RFA
- Meeting Minutes
- Procurement/SOW/Contract
- Audit/Investigation Report
- Federal Report to Congress
- Country/Policy Report
- Academic Program/Clinic Brochure
- Proposal/White Paper
- Other Legal

**Response format:**
Document Type: [type]
Confidence: [High/Medium/Low]
Key Indicators: [list specific patterns]"""

        classification_result = ollama.generate(model, classification_prompt, 500)
        
        # Process key sections from different chunks
        key_sections = []
        for i, chunk in enumerate(chunks[:3]):  # Process first 3 chunks
            section_prompt = f"""# Document Analysis - Section {i+1}

Analyze this document section and extract key information:

**Document:** {filename}
**Content:** {chunk}

**Extract:**
- Important dates and deadlines
- Financial information (amounts, budgets, costs)
- Legal requirements and compliance standards
- Key findings and decisions
- Parties and entities mentioned
- Statistics and metrics
- Recommendations and action items

**Format as bullet points.**"""

            section_result = ollama.generate(model, section_prompt, 800)
            if section_result:
                key_sections.append(f"**Section {i+1}:**\n{section_result}")
        
        # Combine results
        combined_analysis = f"""# Enhanced Document Analysis

**Document:** {filename}

## 📋 Document Classification
{classification_result}

## 📄 Key Sections Analysis
{chr(10).join(key_sections)}

## 📝 Summary
This document was processed in chunks due to its large size. The analysis above covers the most important sections and provides a comprehensive overview of the document's key elements."""

        return jsonify({
            "success": True,
            "analysis": combined_analysis,
            "model_used": model,
            "prompt_type": "chunked_analysis",
            "document_type": "large_document_analysis",
            "chunks_processed": len(chunks[:3])
        })
        
    except Exception as e:
        logger.error(f"Chunked processing error: {e}")
        return jsonify({
            "error": "Chunked processing failed",
            "message": str(e)
        }), 500

@app.route('/analyze', methods=['POST'])
def analyze_document():
    """Analyze document with support for incremental summarization"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        text = data.get('text', '')
        model = data.get('model', DEFAULT_MODEL)
        max_tokens = data.get('max_tokens', MAX_TOKENS_PER_REQUEST)
        analysis_type = data.get('analysis_type', 'analyze')
        
        if not text.strip():
            return jsonify({"error": "No text provided for analysis"}), 400
        
        # Handle different analysis types for incremental summarization
        if analysis_type == 'local_summary':
            # For local chunk summaries - use the text directly as it's already a prompt
            prompt = text
            logger.info(f"📝 Generating local summary with {model}")
        elif analysis_type == 'final_synthesis':
            # For final synthesis - use the text directly as it's already a prompt
            prompt = text
            logger.info(f"🔗 Synthesizing final summary with {model}")
        else:
            # Default analysis - use optimized prompt
            prompt = create_optimized_prompt(text, "analyze")
            logger.info(f"🔍 Analyzing document with {model}")
        
        result = ollama.generate(model, prompt, max_tokens)
        
        if not result:
            result = "Unable to analyze document."
        
        return jsonify({
            "success": True,
            "analysis": result,
            "model_used": model,
            "analysis_type": analysis_type,
            "prompt_type": "optimized" if analysis_type == 'analyze' else analysis_type
        })
        
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return jsonify({
            "error": "Analysis failed",
            "message": str(e)
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
