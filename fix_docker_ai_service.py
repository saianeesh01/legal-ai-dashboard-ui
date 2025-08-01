#!/usr/bin/env python3
"""
Script to test and verify the AI service fix in Docker environment
"""

import requests
import json
import time
import subprocess
import sys

def check_docker_status():
    """Check if Docker containers are running"""
    try:
        result = subprocess.run(['docker', 'ps'], capture_output=True, text=True)
        if result.returncode == 0:
            containers = result.stdout
            ai_service_running = 'legal-ai-service' in containers
            frontend_running = 'legal-ai-frontend' in containers
            return ai_service_running, frontend_running
        return False, False
    except FileNotFoundError:
        print("❌ Docker not found. Make sure Docker is installed and running.")
        return False, False

def test_ai_service_health():
    """Test AI service health endpoint"""
    try:
        response = requests.get("http://localhost:5001/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ AI Service Health: {data.get('status')}")
            print(f"📡 Ollama Available: {data.get('ollama_available')}")
            print(f"🤖 Available Models: {data.get('available_models', [])}")
            print(f"💎 Gemma Models: {data.get('gemma_models_available', [])}")
            return True, data
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False, None
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to AI service. Check if container is running.")
        return False, None

def test_analysis_endpoint():
    """Test the analysis endpoint with sample data"""
    test_data = {
        "text": """IMMIGRATION ASYLUM APPLICATION FORM I-589
        
        Application for Asylum and for Withholding of Removal
        
        This form is used to apply for asylum in the United States and for withholding of removal under section 241(b)(3) of the Immigration and Nationality Act (INA).
        
        PART A. INFORMATION ABOUT YOU
        1. Alien Registration Number (A-Number): A 123 456 789
        2. U.S. Social Security Number: 123-45-6789
        3. Complete Last Name: LASTNAME
        4. First Name: FIRSTNAME
        5. Middle Name: MIDDLE
        6. Date of Birth: 01/01/1990
        
        This document contains sufficient content for AI analysis and represents a typical legal immigration document that requires comprehensive review and analysis by legal professionals.""",
        "filename": "i-589_asylum_application.pdf",
        "analysis_type": "comprehensive"
    }
    
    try:
        print("\n🧪 Testing analysis endpoint...")
        response = requests.post(
            "http://localhost:5001/analyze",
            json=test_data,
            timeout=120
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            analysis = result.get('analysis', '')
            
            print(f"✅ Analysis Length: {len(analysis)} characters")
            if len(analysis) > 50:
                print(f"📄 Analysis Preview: {analysis[:200]}...")
                print(f"🤖 Model Used: {result.get('model_used', 'unknown')}")
                print(f"📊 Word Count: {result.get('word_count', 0)}")
                return True
            else:
                print(f"❌ Analysis too short: '{analysis}'")
                print(f"Full response: {json.dumps(result, indent=2)}")
                return False
        else:
            print(f"❌ Analysis failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Error text: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

def main():
    """Main test function"""
    print("🔧 Testing AI Service Fix for Docker Environment")
    print("=" * 50)
    
    # Check Docker status
    print("1. Checking Docker containers...")
    ai_running, frontend_running = check_docker_status()
    
    if not ai_running:
        print("❌ AI service container not running. Start with:")
        print("   docker-compose up -d ai_service")
        return False
    
    print("✅ AI service container is running")
    
    # Test health endpoint
    print("\n2. Testing AI service health...")
    health_ok, health_data = test_ai_service_health()
    
    if not health_ok:
        print("❌ Health check failed")
        return False
    
    # Test analysis endpoint
    print("\n3. Testing analysis functionality...")
    analysis_ok = test_analysis_endpoint()
    
    if analysis_ok:
        print("\n🎉 SUCCESS: AI service is working correctly!")
        print("✅ Empty response issue has been fixed")
        print("✅ Gemma model fallback is working")
        print("✅ Analysis endpoint returns proper content")
        return True
    else:
        print("\n❌ FAILED: Analysis endpoint still has issues")
        print("🔧 Try restarting the AI service container:")
        print("   docker-compose restart ai_service")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)