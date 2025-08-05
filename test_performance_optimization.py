#!/usr/bin/env python3
"""
Test script to verify document processing performance after optimizations.
Target: Process 60+ page documents in under 2 minutes.
"""

import time
import requests
import sys
from pathlib import Path

def test_document_processing(file_path: str):
    """Test document upload and analysis performance"""
    
    print(f"🧪 Testing document processing performance")
    print(f"📄 Document: {file_path}")
    
    # Check file size
    file_size = Path(file_path).stat().st_size / (1024 * 1024)  # MB
    print(f"📊 File size: {file_size:.2f} MB")
    
    # Step 1: Upload document
    print("\n⬆️  Uploading document...")
    start_time = time.time()
    
    with open(file_path, 'rb') as f:
        files = {'file': (Path(file_path).name, f, 'application/pdf')}
        upload_response = requests.post('http://localhost:3001/api/upload', files=files)
    
    if upload_response.status_code != 200:
        print(f"❌ Upload failed: {upload_response.status_code}")
        print(upload_response.text)
        return
    
    job_id = upload_response.json()['job_id']
    upload_time = time.time() - start_time
    print(f"✅ Upload completed in {upload_time:.1f}s")
    print(f"🆔 Job ID: {job_id}")
    
    # Step 2: Analyze document
    print("\n🔍 Analyzing document...")
    analysis_start = time.time()
    
    try:
        analysis_response = requests.post(
            'http://localhost:3001/api/analyze',
            json={'job_id': job_id},
            timeout=150  # 2.5 minutes timeout
        )
        
        analysis_time = time.time() - analysis_start
        total_time = time.time() - start_time
        
        if analysis_response.status_code == 200:
            result = analysis_response.json()
            print(f"\n✅ Analysis completed successfully!")
            print(f"⏱️  Analysis time: {analysis_time:.1f}s")
            print(f"⏱️  Total time: {total_time:.1f}s")
            print(f"\n📊 Results:")
            print(f"   - Verdict: {result.get('verdict', 'unknown')}")
            print(f"   - Confidence: {result.get('confidence', 0) * 100:.0f}%")
            print(f"   - Summary length: {len(result.get('summary', ''))} chars")
            
            # Performance check
            if total_time < 120:
                print(f"\n🎉 SUCCESS: Processing completed in under 2 minutes!")
            else:
                print(f"\n⚠️  WARNING: Processing took longer than 2 minutes ({total_time:.1f}s)")
                
        else:
            print(f"❌ Analysis failed: {analysis_response.status_code}")
            print(analysis_response.text)
            
    except requests.exceptions.Timeout:
        print(f"❌ Analysis timed out after 2.5 minutes")
        print(f"⏱️  Time elapsed: {time.time() - start_time:.1f}s")
        
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        print(f"⏱️  Time elapsed: {time.time() - start_time:.1f}s")

def main():
    # Check if services are running
    try:
        health = requests.get('http://localhost:3001/api/health', timeout=5)
        if health.status_code != 200:
            print("❌ Backend service is not healthy")
            sys.exit(1)
    except:
        print("❌ Backend service is not running on http://localhost:3001")
        print("Please start the services first: docker-compose up")
        sys.exit(1)
    
    # Test with a large document
    test_files = [
        "Legal_docs/528267_JAPAN-2023-HUMAN-RIGHTS-REPORT.pdf",  # 44 pages
        "Legal_docs/Report-Proposed-Refugee-Admissions-for-FY25.pdf",  # Large report
    ]
    
    for test_file in test_files:
        if Path(test_file).exists():
            test_document_processing(test_file)
            print("\n" + "="*50 + "\n")
            break
    else:
        print("❌ No test documents found. Please provide a PDF file path as argument.")
        if len(sys.argv) > 1:
            test_document_processing(sys.argv[1])

if __name__ == "__main__":
    main()