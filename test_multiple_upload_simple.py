#!/usr/bin/env python3
"""
Simple test for multiple document upload functionality
"""

import requests
import json
import os

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

def test_multiple_upload():
    """Test multiple file upload"""
    
    # Create test files
    test_files = [
        ("test_doc1.txt", "This is test document 1 content."),
        ("test_doc2.txt", "This is test document 2 content."),
        ("test_doc3.txt", "This is test document 3 content.")
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

if __name__ == "__main__":
    print("🧪 Testing Legal AI Multiple Upload Functionality")
    print("=" * 50)
    
    # Test single upload first
    print("\n1. Testing single file upload...")
    single_success = test_single_upload()
    
    # Test multiple upload
    print("\n2. Testing multiple file upload...")
    multiple_success = test_multiple_upload()
    
    print("\n" + "=" * 50)
    if single_success and multiple_success:
        print("🎉 All tests passed! Multiple upload functionality is working.")
    else:
        print("❌ Some tests failed. Check the logs above for details.")

