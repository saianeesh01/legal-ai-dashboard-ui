#!/usr/bin/env python3
"""
Test script to verify unified summarization is working correctly
"""

import requests
import json
import time

def test_unified_summarization():
    """Test the unified summarization endpoint"""
    
    # Test document content (simulating a legal document)
    test_content = """
    NOTICE TO APPEAR
    
    UNITED STATES IMMIGRATION COURT
    
    Case Number: A123-456-789
    Respondent: John Doe
    Date of Hearing: March 15, 2024
    
    The Department of Homeland Security hereby serves notice that removal proceedings have been initiated against the above-named respondent. The respondent is charged with being removable from the United States under Section 237(a)(1)(B) of the Immigration and Nationality Act.
    
    The respondent is ordered to appear before the Immigration Court on March 15, 2024, at 9:00 AM at 123 Court Street, New York, NY 10001. Failure to appear may result in an order of removal in absentia.
    
    The respondent has the right to be represented by counsel at no expense to the government. The respondent may apply for relief from removal including, but not limited to, asylum, withholding of removal, and cancellation of removal.
    
    This notice is being served pursuant to 8 CFR 1003.15 and 1003.16.
    
    Dated: January 15, 2024
    Signed: Immigration Officer
    """
    
    print("🧪 Testing unified summarization...")
    print(f"📄 Test document length: {len(test_content)} characters")
    
    # Test the AI service summarization endpoint
    try:
        response = requests.post(
            "http://localhost:5001/summarize",
            json={
                "text": test_content,
                "filename": "test_nta_document.pdf",
                "model": "mistral:7b-instruct-q4_0",
                "max_tokens": 800
            },
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            summary = data.get("summary", "No summary generated")
            print("✅ Unified summarization successful!")
            print(f"📝 Summary length: {len(summary)} characters")
            print(f"📋 Summary: {summary}")
            print(f"🔧 Model used: {data.get('model_used', 'Unknown')}")
            print(f"📝 Prompt type: {data.get('prompt_type', 'Unknown')}")
            return True
        else:
            print(f"❌ Summarization failed with status {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing summarization: {e}")
        return False

def test_backend_integration():
    """Test the backend integration with unified summarization"""
    
    print("\n🧪 Testing backend integration...")
    
    # Test the backend analyze endpoint
    try:
        response = requests.post(
            "http://localhost:3001/api/analyze",
            json={
                "job_id": "test_job_123"
            },
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend analysis successful!")
            print(f"📋 Verdict: {data.get('verdict', 'Unknown')}")
            print(f"📊 Confidence: {data.get('confidence', 0)}")
            print(f"📝 Summary length: {len(data.get('summary', ''))} characters")
            return True
        else:
            print(f"❌ Backend analysis failed with status {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing backend integration: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting unified summarization tests...")
    
    # Test AI service directly
    ai_success = test_unified_summarization()
    
    # Test backend integration
    backend_success = test_backend_integration()
    
    print("\n📊 Test Results:")
    print(f"AI Service: {'✅ PASS' if ai_success else '❌ FAIL'}")
    print(f"Backend Integration: {'✅ PASS' if backend_success else '❌ FAIL'}")
    
    if ai_success and backend_success:
        print("\n🎉 All tests passed! Unified summarization is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check the implementation.") 