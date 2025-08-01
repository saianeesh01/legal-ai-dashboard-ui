#!/usr/bin/env python3
"""
Test the fixed AI service analysis endpoint
"""

import requests
import json
import sys

def test_analysis_endpoint():
    """Test the /analyze endpoint with logging"""
    
    # Test data that should trigger the issue
    test_data = {
        "text": "This is a comprehensive legal document analysis test. The document contains sufficient content to validate that the analysis endpoint functions properly. This test verifies that the AI service can process legal documents and return meaningful analysis results instead of empty responses. The document processing pipeline should handle this text and generate a proper analysis using the Gemma model variants.",
        "filename": "test_legal_document.pdf",
        "analysis_type": "comprehensive"
    }
    
    try:
        print("🧪 Testing AI service analysis endpoint...")
        
        # Test health endpoint first
        health_response = requests.get("http://localhost:5001/health", timeout=10)
        print(f"Health check status: {health_response.status_code}")
        
        if health_response.status_code == 200:
            health_data = health_response.json()
            print(f"Ollama available: {health_data.get('ollama_available')}")
            print(f"Available models: {health_data.get('available_models', [])}")
            print(f"Gemma models: {health_data.get('gemma_models_available', [])}")
        
        # Test analysis endpoint
        print("\n🤖 Testing analysis endpoint...")
        response = requests.post(
            "http://localhost:5001/analyze",
            json=test_data,
            timeout=120
        )
        
        print(f"Analysis response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            analysis_text = result.get('analysis', '')
            print(f"✅ Analysis returned {len(analysis_text)} characters")
            
            if len(analysis_text) > 0:
                print(f"📄 Analysis preview: {analysis_text[:200]}...")
                print("✅ SUCCESS: AI service is now returning analysis content!")
                return True
            else:
                print("❌ STILL EMPTY: Analysis text is empty")
                print(f"Full response: {json.dumps(result, indent=2)}")
                return False
        else:
            print(f"❌ Error response: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to AI service on localhost:5001")
        print("🔧 Start the AI service first: cd ai_service && python app.py")
        return False
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

if __name__ == "__main__":
    success = test_analysis_endpoint()
    sys.exit(0 if success else 1)