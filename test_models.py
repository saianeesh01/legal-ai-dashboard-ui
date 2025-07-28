#!/usr/bin/env python3
"""
Test script to compare Ollama model speeds
"""

import requests
import time
import json

def test_model_speed(model_name, prompt, timeout=30):
    """Test a model's response time"""
    start_time = time.time()
    
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "top_p": 0.9,
                    "max_tokens": 300,
                    "num_predict": 300
                }
            },
            timeout=timeout
        )
        
        if response.status_code == 200:
            elapsed = time.time() - start_time
            return {
                "model": model_name,
                "success": True,
                "time": elapsed,
                "response_length": len(response.json().get("response", ""))
            }
        else:
            return {
                "model": model_name,
                "success": False,
                "error": f"HTTP {response.status_code}"
            }
            
    except Exception as e:
        return {
            "model": model_name,
            "success": False,
            "error": str(e)
        }

def main():
    # Test prompt
    test_prompt = """
Analyze this document and return JSON:

Document: test.pdf
Content: This is a test document for legal analysis.

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

    # Available models (ordered by expected speed)
    models = [
        "mistral:7b-instruct",   # Fastest available
        "mistral:7b",            # Medium
        "llama3:latest"          # Slowest
    ]
    
    print("Testing Ollama model speeds...")
    print("=" * 50)
    
    results = []
    
    for model in models:
        print(f"\nTesting {model}...")
        result = test_model_speed(model, test_prompt)
        results.append(result)
        
        if result["success"]:
            print(f"✅ {model}: {result['time']:.2f}s ({result['response_length']} chars)")
        else:
            print(f"❌ {model}: {result['error']}")
    
    # Summary
    print("\n" + "=" * 50)
    print("SPEED RANKING:")
    
    successful_results = [r for r in results if r["success"]]
    successful_results.sort(key=lambda x: x["time"])
    
    for i, result in enumerate(successful_results, 1):
        print(f"{i}. {result['model']}: {result['time']:.2f}s")
    
    if successful_results:
        fastest = successful_results[0]
        print(f"\n🏆 Fastest model: {fastest['model']} ({fastest['time']:.2f}s)")
        print(f"💡 Recommended for production: {fastest['model']}")

if __name__ == "__main__":
    main() 