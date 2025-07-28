#!/usr/bin/env python3
"""
Quick test for Mistral performance
"""

import requests
import time
import json

def test_mistral_speed():
    """Test Mistral's response time with optimized settings"""
    
    test_prompt = """
Analyze this document and return JSON:

Document: test.pdf
Content: This is a legal document for testing purposes.

Tasks:
1. Classify as "proposal" or "non-proposal" with confidence 0.0-1.0
2. Write 50-word summary

Return JSON:
{
  "verdict": "non-proposal",
  "confidence": 0.8,
  "summary": "..."
}
"""

    start_time = time.time()
    
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "tinyllama:latest",
                "prompt": test_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.05,
                    "top_p": 0.95,
                    "max_tokens": 400,
                    "num_predict": 400,
                    "top_k": 40,
                    "repeat_penalty": 1.1
                }
            },
            timeout=15
        )
        
        if response.status_code == 200:
            elapsed = time.time() - start_time
            result = response.json().get("response", "")
            print(f"✅ TinyLlama test successful!")
            print(f"⏱️  Response time: {elapsed:.2f} seconds")
            print(f"📝 Response length: {len(result)} characters")
            print(f"📊 Response preview: {result[:200]}...")
            return True
        else:
            print(f"❌ TinyLlama test failed: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ TinyLlama test error: {e}")
        return False

if __name__ == "__main__":
    print("Testing TinyLlama performance (faster model)...")
    print("=" * 50)
    test_mistral_speed() 