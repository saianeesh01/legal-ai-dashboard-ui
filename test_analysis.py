#!/usr/bin/env python3
"""
Test script to verify LLM analysis is working
"""

import requests
import json

def test_job_details():
    """Test getting job details"""
    
    job_id = "job_1754591967998_4xrmfprq8"  # From the latest upload
    
    print("📋 Testing Job Details...")
    print(f"📋 Job ID: {job_id}")
    
    try:
        # Get all documents to see the job details
        response = requests.get('http://localhost:5000/api/documents', timeout=10)
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            documents = response.json()
            job = None
            for doc in documents:
                if doc.get('id') == job_id:
                    job = doc
                    break
            
            if job:
                print("✅ Job found!")
                print(f"📄 File Name: {job.get('fileName', 'Unknown')}")
                print(f"📊 Status: {job.get('status', 'Unknown')}")
                print(f"📈 Progress: {job.get('progress', 'Unknown')}")
                print(f"📝 File Content Length: {len(job.get('fileContent', ''))}")
                print(f"🧠 AI Analysis: {'Yes' if job.get('aiAnalysis') else 'No'}")
                
                if job.get('aiAnalysis'):
                    try:
                        analysis = json.loads(job['aiAnalysis'])
                        print(f"📄 Document Type: {analysis.get('documentType', 'Unknown')}")
                        print(f"🎯 Confidence: {analysis.get('confidence', 'Unknown')}")
                        print(f"📝 Summary: {analysis.get('summary', 'No summary')[:100]}...")
                        print(f"🔍 Evidence Count: {len(analysis.get('evidence', []))}")
                    except:
                        print("❌ Could not parse AI analysis")
                
                return job
            else:
                print("❌ Job not found in documents list")
                return None
        else:
            print(f"❌ Failed to get documents: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting job details: {e}")
        return None

def test_analysis():
    """Test LLM analysis for a specific job"""
    
    job_id = "job_1754591967998_4xrmfprq8"  # From the latest upload
    
    print("\n🧠 Testing LLM Analysis...")
    print(f"📋 Job ID: {job_id}")
    
    try:
        # Test the analysis endpoint
        response = requests.post(
            'http://localhost:5000/api/analyze',
            json={'job_id': job_id},
            timeout=30
        )
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Analysis completed successfully!")
            print(f"📄 Document Type: {data.get('documentType', 'Unknown')}")
            print(f"🎯 Confidence: {data.get('confidence', 'Unknown')}")
            print(f"📝 Summary: {data.get('summary', 'No summary')[:100]}...")
            print(f"🔍 Evidence Count: {len(data.get('evidence', []))}")
            return True
        else:
            print(f"❌ Analysis failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during analysis test: {e}")
        return False

def test_ai_service():
    """Test if the AI service is responding"""
    
    print("\n🤖 Testing AI Service...")
    
    try:
        response = requests.get('http://localhost:5001/health', timeout=5)
        print(f"📊 AI Service status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ AI Service is responding")
            return True
        else:
            print("❌ AI Service is not responding properly")
            return False
            
    except Exception as e:
        print(f"❌ AI Service error: {e}")
        return False

if __name__ == "__main__":
    print("🧠 Testing Legal AI LLM Analysis")
    print("=" * 50)
    
    # Test AI service first
    ai_service_ok = test_ai_service()
    
    # Test job details
    job_details = test_job_details()
    
    # Test analysis
    analysis_ok = test_analysis()
    
    print("\n" + "=" * 50)
    if ai_service_ok and job_details and analysis_ok:
        print("🎉 LLM analysis is working correctly!")
    else:
        print("❌ Some tests failed. Check the logs above.")
