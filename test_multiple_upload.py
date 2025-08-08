#!/usr/bin/env python3
"""
Test script for multiple document upload functionality
"""

import requests
import json
import time
import os

def test_multiple_upload():
    """Test multiple file upload functionality"""
    
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
            'http://localhost:3000/api/upload',
            files=files
        )
        
        print(f"📊 Response status: {response.status_code}")
        print(f"📋 Response body: {response.text}")
        
        if response.status_code == 200:
            print("✅ Multiple upload test passed!")
        else:
            print("❌ Multiple upload test failed!")
            
    except Exception as e:
        print(f"❌ Error during test: {e}")
    
    finally:
        # Clean up test files
        for filename, _ in test_files:
            if os.path.exists(filename):
                os.remove(filename)

if __name__ == "__main__":
    test_multiple_upload()

