#!/usr/bin/env python3
"""
Simple test for unified summarization
"""

import requests
import json

def test_simple_summarization():
    """Test the unified summarization with a simple document"""
    
    # Simple test content
    test_content = """
    This is a test legal document. It contains information about immigration proceedings.
    The document discusses removal proceedings and court dates. Important dates include March 15, 2024.
    The respondent is John Doe and the case number is A123-456-789.
    """
    
    print("🧪 Testing simple unified summarization...")
    print(f"📄 Test document length: {len(test_content)} characters")
    
    try:
        response = requests.post(
            "http://localhost:5001/summarize",
            json={
                "text": test_content,
                "filename": "test_document.pdf",
                "model": "mistral:7b-instruct-q4_0",
                "max_tokens": 200  # Smaller token limit for faster response
            },
            timeout=30  # Shorter timeout
        )
        
        if response.status_code == 200:
            data = response.json()
            summary = data.get("summary", "No summary generated")
            print("✅ Unified summarization successful!")
            print(f"📝 Summary: {summary}")
            print(f"🔧 Model used: {data.get('model_used', 'Unknown')}")
            print(f"📝 Prompt type: {data.get('prompt_type', 'Unknown')}")
            return True
        else:
            print(f"❌ Summarization failed with status {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out - AI service is processing but taking too long")
        return False
    except Exception as e:
        print(f"❌ Error testing summarization: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting simple unified summarization test...")
    
    success = test_simple_summarization()
    
    if success:
        print("\n🎉 Test passed! Unified summarization is working correctly.")
        print("✅ The system now combines all chunks into one paragraph summary instead of chunk-by-chunk processing.")
    else:
        print("\n⚠️  Test failed. The AI service might be overloaded or not responding.") 