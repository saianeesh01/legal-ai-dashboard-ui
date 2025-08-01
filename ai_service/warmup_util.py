#!/usr/bin/env python3
"""
Simple warmup utility for AI model
Can be called directly or imported
"""

import os
import requests
import logging

def warm_up_model(ollama_host=None, retries=3):
    """
    Warm up the Ollama model with legal document context
    
    Args:
        ollama_host: Override default OLLAMA_HOST
        retries: Number of retry attempts
    
    Returns:
        bool: True if successful, False otherwise
    """
    
    if not ollama_host:
        ollama_host = os.getenv('OLLAMA_HOST', 'localhost:11434')
    
    # Ensure proper URL format
    if not ollama_host.startswith('http'):
        ollama_host = f'http://{ollama_host}'
    
    warmup_payload = {
        "model": "gemma2:2b",
        "prompt": "Analyze this legal document sample: 'NOTICE TO APPEAR - Immigration Court proceedings scheduled for case review.' Provide document classification. This is a model warmup request.",
        "stream": False,
        "options": {
            "temperature": 0.3,
            "num_predict": 50
        }
    }
    
    for attempt in range(retries):
        try:
            print(f"🔥 Warmup attempt {attempt + 1}/{retries} to {ollama_host}")
            
            response = requests.post(
                f'{ollama_host}/api/generate',
                json=warmup_payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('response'):
                    print("✅ Model warmup successful")
                    return True
                else:
                    print("⚠️ Empty response from model")
                    
        except Exception as e:
            print(f"❌ Warmup attempt {attempt + 1} failed: {e}")
            
        if attempt < retries - 1:
            print("⏳ Waiting 10 seconds before retry...")
            import time
            time.sleep(10)
    
    print("❌ All warmup attempts failed")
    return False

if __name__ == "__main__":
    import sys
    
    # Simple CLI usage
    ollama_host = sys.argv[1] if len(sys.argv) > 1 else None
    success = warm_up_model(ollama_host)
    
    if success:
        print("🎯 AI model is ready for legal document analysis")
        sys.exit(0)
    else:
        print("⚠️ Warmup failed, but model may still work")
        sys.exit(1)