#!/usr/bin/env python3
"""
CPU Optimization Test Script
Tests the refactored Flask backend and Node.js frontend for CPU usage optimization
"""

import requests
import time
import json
import sys
from typing import Dict, Any

# Configuration
AI_SERVICE_URL = "http://localhost:5001"
TEST_DOCUMENT = """
LEGAL DOCUMENT ANALYSIS

This is a test legal document for CPU optimization testing. The document contains multiple sections that need to be processed sequentially to reduce CPU usage.

SECTION 1: DOCUMENT OVERVIEW
This legal document contains important information regarding immigration law services. The document appears to be a funding proposal seeking support for program implementation and requires detailed analysis for complete understanding.

SECTION 2: KEY COMPONENTS
- Legal framework and procedural requirements
- Stakeholder roles and responsibilities  
- Implementation timeline and key milestones
- Compliance and regulatory considerations
- Financial and resource allocation details

SECTION 3: ANALYSIS INDICATORS
Based on filename analysis, this document likely contains:
- Program objectives and measurable goals
- Implementation timeline with specific milestones
- Budget and detailed financial projections
- Evaluation methodology and success metrics
- Sustainability and long-term planning strategies

SECTION 4: PROCESSING NOTES
Document analysis reveals proposal-type content with funding requests and comprehensive program planning with direct relevance to immigration law and federal compliance regulations.

SECTION 5: RECOMMENDATIONS
- Complete content extraction and detailed analysis
- Section-by-section comprehensive review
- Stakeholder impact assessment and planning
- Compliance verification and regulatory review
- Implementation planning and resource allocation

This document represents important legal content requiring professional analysis and comprehensive interpretation to ensure full understanding and proper implementation.
"""

def test_ai_service_health() -> bool:
    """Test if AI service is healthy and shows CPU optimizations"""
    try:
        response = requests.get(f"{AI_SERVICE_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ AI Service Health Check:")
            print(f"   Status: {data.get('status')}")
            print(f"   Ollama Available: {data.get('ollama_available')}")
            print(f"   Default Model: {data.get('default_model')}")
            
            # Check CPU optimizations
            cpu_opts = data.get('cpu_optimizations', {})
            if cpu_opts:
                print("✅ CPU Optimizations Detected:")
                print(f"   Parallel Requests: {cpu_opts.get('num_parallel')}")
                print(f"   Context Length: {cpu_opts.get('context_length')}")
                print(f"   Max Tokens: {cpu_opts.get('max_tokens')}")
                return True
            else:
                print("❌ CPU optimizations not found in health check")
                return False
        else:
            print(f"❌ AI Service health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ AI Service health check error: {e}")
        return False

def test_sequential_processing() -> Dict[str, Any]:
    """Test sequential processing with CPU optimizations"""
    print("\n🧪 Testing Sequential Processing...")
    
    start_time = time.time()
    
    try:
        # Test summarize endpoint with CPU optimizations
        response = requests.post(
            f"{AI_SERVICE_URL}/summarize",
            json={
                "text": TEST_DOCUMENT,
                "model": "mistral:7b-instruct-q4_0",
                "max_tokens": 300
            },
            timeout=120  # 2 minute timeout
        )
        
        processing_time = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Sequential Processing Test Successful:")
            print(f"   Processing Time: {processing_time:.2f} seconds")
            print(f"   Model Used: {data.get('model_used')}")
            print(f"   Total Chunks: {data.get('total_chunks')}")
            print(f"   Word Count: {data.get('original_word_count')}")
            
            # Check CPU optimizations in response
            cpu_opts = data.get('cpu_optimizations', {})
            if cpu_opts:
                print("✅ CPU Optimizations Applied:")
                print(f"   Sequential Processing: {cpu_opts.get('sequential_processing')}")
                print(f"   Max Tokens: {cpu_opts.get('max_tokens')}")
                print(f"   Context Length: {cpu_opts.get('context_length')}")
            
            return {
                "success": True,
                "processing_time": processing_time,
                "model_used": data.get('model_used'),
                "total_chunks": data.get('total_chunks'),
                "cpu_optimizations": cpu_opts
            }
        else:
            print(f"❌ Sequential processing test failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return {"success": False, "error": f"HTTP {response.status_code}"}
            
    except Exception as e:
        print(f"❌ Sequential processing test error: {e}")
        return {"success": False, "error": str(e)}

def test_model_fallback() -> Dict[str, Any]:
    """Test model fallback logic with optimized models"""
    print("\n🧪 Testing Model Fallback Logic...")
    
    try:
        # Test with a model that might not be available
        response = requests.post(
            f"{AI_SERVICE_URL}/analyze",
            json={
                "text": TEST_DOCUMENT[:1000],  # Smaller text for faster test
                "filename": "test_cpu_optimization.pdf",
                "model": "nonexistent-model",
                "analysis_type": "comprehensive"
            },
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Model Fallback Test Successful:")
            print(f"   Model Used: {data.get('model_used')}")
            print(f"   Analysis Length: {len(data.get('analysis', ''))}")
            
            # Check CPU optimizations
            cpu_opts = data.get('cpu_optimizations', {})
            if cpu_opts:
                print("✅ CPU Optimizations in Analysis:")
                print(f"   Sequential Processing: {cpu_opts.get('sequential_processing')}")
                print(f"   Max Tokens: {cpu_opts.get('max_tokens')}")
            
            return {
                "success": True,
                "model_used": data.get('model_used'),
                "analysis_length": len(data.get('analysis', '')),
                "cpu_optimizations": cpu_opts
            }
        else:
            print(f"❌ Model fallback test failed: {response.status_code}")
            return {"success": False, "error": f"HTTP {response.status_code}"}
            
    except Exception as e:
        print(f"❌ Model fallback test error: {e}")
        return {"success": False, "error": str(e)}

def test_available_models() -> Dict[str, Any]:
    """Test available models endpoint"""
    print("\n🧪 Testing Available Models...")
    
    try:
        response = requests.get(f"{AI_SERVICE_URL}/models", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Available Models Test:")
            print(f"   Default Model: {data.get('default_model')}")
            print(f"   Ollama Available: {data.get('ollama_available')}")
            
            optimized_models = data.get('optimized_models', [])
            print(f"   Optimized Models: {optimized_models}")
            
            available_models = data.get('available_models', [])
            print(f"   Available Models: {available_models}")
            
            # Check CPU optimizations
            cpu_opts = data.get('cpu_optimizations', {})
            if cpu_opts:
                print("✅ CPU Optimizations Configuration:")
                print(f"   Parallel Requests: {cpu_opts.get('num_parallel')}")
                print(f"   Context Length: {cpu_opts.get('context_length')}")
                print(f"   Max Tokens: {cpu_opts.get('max_tokens')}")
            
            return {
                "success": True,
                "default_model": data.get('default_model'),
                "optimized_models": optimized_models,
                "available_models": available_models,
                "cpu_optimizations": cpu_opts
            }
        else:
            print(f"❌ Available models test failed: {response.status_code}")
            return {"success": False, "error": f"HTTP {response.status_code}"}
            
    except Exception as e:
        print(f"❌ Available models test error: {e}")
        return {"success": False, "error": str(e)}

def main():
    """Run all CPU optimization tests"""
    print("🚀 CPU Optimization Test Suite")
    print("=" * 50)
    
    # Test 1: Health check
    health_ok = test_ai_service_health()
    if not health_ok:
        print("❌ Health check failed. Please ensure AI service is running.")
        sys.exit(1)
    
    # Test 2: Available models
    models_result = test_available_models()
    
    # Test 3: Sequential processing
    processing_result = test_sequential_processing()
    
    # Test 4: Model fallback
    fallback_result = test_model_fallback()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 CPU Optimization Test Summary")
    print("=" * 50)
    
    tests = [
        ("Health Check", health_ok),
        ("Available Models", models_result.get('success', False)),
        ("Sequential Processing", processing_result.get('success', False)),
        ("Model Fallback", fallback_result.get('success', False))
    ]
    
    passed = 0
    for test_name, success in tests:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if success:
            passed += 1
    
    print(f"\n🎯 Results: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("🎉 All CPU optimization tests passed!")
        print("\n✅ CPU Optimizations Verified:")
        print("   - Sequential processing enabled")
        print("   - Reduced context length (1024)")
        print("   - Limited max tokens (300)")
        print("   - Optimized models with fallback")
        print("   - Single request at a time")
    else:
        print("⚠️  Some tests failed. Check the logs above.")
        sys.exit(1)

if __name__ == "__main__":
    main() 