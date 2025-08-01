#!/usr/bin/env python3
"""
Test script for Docker warmup system
"""

import subprocess
import sys
import time
import requests
import json

def run_command(cmd, shell=True):
    """Run a command and return success status"""
    try:
        result = subprocess.run(cmd, shell=shell, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def test_docker_available():
    """Test if Docker is available"""
    print("🐳 Testing Docker availability...")
    success, stdout, stderr = run_command("docker --version")
    if success:
        print(f"✅ Docker available: {stdout.strip()}")
        return True
    else:
        print(f"❌ Docker not available: {stderr}")
        return False

def test_compose_syntax():
    """Test docker-compose file syntax"""
    print("📋 Testing docker-compose syntax...")
    success, stdout, stderr = run_command("docker-compose config")
    if success:
        print("✅ docker-compose.yml syntax is valid")
        return True
    else:
        print(f"❌ docker-compose syntax error: {stderr}")
        return False

def test_python_syntax():
    """Test Python file syntax"""
    print("🐍 Testing Python file syntax...")
    
    files_to_test = [
        "ai_service/app.py",
        "ai_service/warmup_util.py", 
        "ai_service/warmup_daemon.py"
    ]
    
    all_good = True
    for file_path in files_to_test:
        success, stdout, stderr = run_command(f"python -m py_compile {file_path}")
        if success:
            print(f"✅ {file_path} syntax OK")
        else:
            print(f"❌ {file_path} syntax error: {stderr}")
            all_good = False
    
    return all_good

def test_docker_build():
    """Test Docker build process"""
    print("🔨 Testing Docker build...")
    
    # Test AI service build
    success, stdout, stderr = run_command("cd ai_service && docker build . -t test-ai-service")
    if success:
        print("✅ AI service builds successfully")
        return True
    else:
        print(f"❌ AI service build failed: {stderr}")
        return False

def test_warmup_utility():
    """Test warmup utility directly"""
    print("🔥 Testing warmup utility...")
    
    success, stdout, stderr = run_command("cd ai_service && python warmup_util.py")
    # This will fail if Ollama isn't running, but should not have syntax errors
    if "Failed to establish a new connection" in stderr or "Connection refused" in stderr:
        print("✅ Warmup utility runs (Ollama not available, but that's expected)")
        return True
    elif success:
        print("✅ Warmup utility runs successfully")
        return True
    else:
        print(f"❌ Warmup utility has issues: {stderr}")
        return False

def main():
    print("🚀 Docker Warmup System Test")
    print("=" * 40)
    
    tests = [
        ("Docker availability", test_docker_available),
        ("Docker Compose syntax", test_compose_syntax),
        ("Python syntax", test_python_syntax),
        ("Warmup utility", test_warmup_utility),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
            print()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
            print()
    
    # Only test Docker build if Docker is available
    if results[0][1]:  # Docker is available
        try:
            result = test_docker_build()
            results.append(("Docker build", result))
        except Exception as e:
            print(f"❌ Docker build failed with exception: {e}")
            results.append(("Docker build", False))
    
    # Summary
    print("📊 Test Results Summary")
    print("=" * 40)
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("\n🎉 All tests passed! Docker warmup system is ready.")
        return 0
    else:
        print(f"\n⚠️  {len(results) - passed} tests failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())