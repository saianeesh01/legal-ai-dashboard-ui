#!/usr/bin/env python3
"""
Minimal AI service test to verify the analysis endpoint works
"""

from flask import Flask, request, jsonify
import logging

# Setup logging  
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "ollama_available": False,
        "service": "test_mode"
    })

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        text = data.get('text', '')
        filename = data.get('filename', 'document.pdf')
        
        # Validate basic text requirements
        if not text or len(text.strip()) < 10:
            return jsonify({
                "error": "Invalid text content",
                "reason": "Text too short or empty"
            }), 400
        
        # Mock analysis response (since Ollama isn't available)
        return jsonify({
            "success": True,
            "analysis": f"Analysis of {filename}: This appears to be a legal document containing {len(text.split())} words. The document analysis is complete.",
            "document_filename": filename,
            "analysis_type": "comprehensive", 
            "model_used": "test_mode",
            "word_count": len(text.split()),
            "text_sample": text[:200] + "..." if len(text) > 200 else text
        })
        
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return jsonify({
            "error": "Analysis generation failed",
            "reason": str(e)
        }), 500

if __name__ == '__main__':
    logger.info("Starting minimal AI service test...")
    app.run(host='0.0.0.0', port=5001, debug=False)