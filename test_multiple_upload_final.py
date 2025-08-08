#!/usr/bin/env python3
"""
Final test for multiple document upload functionality
"""

import requests
import json
import os
import time

def test_multiple_upload():
    """Test multiple file upload functionality"""
    
    # Create test files
    test_files = [
        ("test_doc1.txt", "This is test document 1 content for Legal AI analysis."),
        ("test_doc2.txt", "This is test document 2 content for Legal AI analysis."),
        ("test_doc3.txt", "This is test document 3 content for Legal AI analysis.")
    ]
    
    # Create the files
    for filename, content in test_files:
        with open(filename, 'w') as f:
            f.write(content)
    
    try:
        # Prepare files for upload
        files = []
        for filename, _ in test_files:
            files.append(('file', (filename, open(filename, 'rb'), 'text/plain')))
        
        print("📁 Testing multiple file upload...")
        print(f"📄 Uploading {len(files)} files: {[f[1][0] for f in files]}")
        
        # Upload files
        response = requests.post(
            'http://localhost:5000/api/upload',
            files=files
        )
        
        print(f"📊 Response status: {response.status_code}")
        print(f"📋 Response body: {response.text}")
        
        if response.status_code == 200:
            print("✅ Multiple upload test passed!")
            
            # Parse the response to get job IDs
            try:
                response_data = response.json()
                if 'results' in response_data:
                    print(f"📋 Uploaded {len(response_data['results'])} files successfully")
                    for result in response_data['results']:
                        print(f"  - {result.get('fileName', 'Unknown')}: {result.get('jobId', 'No job ID')}")
                return True
            except json.JSONDecodeError:
                print("⚠️ Could not parse response JSON")
                return True
        else:
            print("❌ Multiple upload test failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error during test: {e}")
        return False
    
    finally:
        # Clean up test files
        for filename, _ in test_files:
            if os.path.exists(filename):
                os.remove(filename)

def test_single_upload():
    """Test single file upload to verify the system works"""
    
    # Create a simple test file
    test_content = "This is a test document for the Legal AI system."
    with open("test_single.txt", "w") as f:
        f.write(test_content)
    
    try:
        # Upload single file
        with open("test_single.txt", "rb") as f:
            files = [('file', ('test_single.txt', f, 'text/plain'))]
            
            print("📁 Testing single file upload...")
            response = requests.post(
                'http://localhost:5000/api/upload',
                files=files
            )
            
            print(f"📊 Response status: {response.status_code}")
            print(f"📋 Response body: {response.text}")
            
            if response.status_code == 200:
                print("✅ Single upload test passed!")
                return True
            else:
                print("❌ Single upload test failed!")
                return False
                
    except Exception as e:
        print(f"❌ Error during test: {e}")
        return False
    
    finally:
        # Clean up test file
        if os.path.exists("test_single.txt"):
            os.remove("test_single.txt")

def check_server_status():
    """Check if the server is running"""
    try:
        response = requests.get('http://localhost:5000/api/documents', timeout=5)
        print("✅ Server is running and responding")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Server is not responding: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Legal AI Multiple Upload Functionality")
    print("=" * 60)
    
    # Check server status first
    print("\n1. Checking server status...")
    if not check_server_status():
        print("❌ Server is not running. Please start the server first.")
        exit(1)
    
    # Test single upload first
    print("\n2. Testing single file upload...")
    single_success = test_single_upload()
    
    # Wait a moment between tests
    time.sleep(2)
    
    # Test multiple upload
    print("\n3. Testing multiple file upload...")
    multiple_success = test_multiple_upload()
    
    print("\n" + "=" * 60)
    if single_success and multiple_success:
        print("🎉 All tests passed! Multiple upload functionality is working.")
        print("\n📝 Next steps:")
        print("1. Open http://localhost:3000 in your browser")
        print("2. Try uploading multiple files through the UI")
        print("3. Check that all upload results are displayed")
    else:
        print("❌ Some tests failed. Check the logs above for details.")

