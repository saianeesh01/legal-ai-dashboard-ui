#!/usr/bin/env python3
"""
Integration test for the enhanced PDF redaction system
Tests the pdf-redactor integration with sample patterns
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from redaction import PDFRedactor, create_redactor
from sensitive_patterns import DEFAULT_PATTERNS, IMPORT_REGEXES

def test_pattern_matching():
    """Test pattern matching with sample sensitive data"""
    print("=== Testing Pattern Matching ===")
    
    # Sample sensitive text
    test_text = """
    John Doe's A-number is A12345678 and his SSN is 123-45-6789.
    Contact him at john.doe@example.com or call 555-123-4567.
    He lives at 123 Main Street, Anytown, USA 12345.
    Credit card: 4532-1234-5678-9012
    """
    
    redactor = PDFRedactor()
    
    # Test pattern detection
    patterns_found = []
    for i, pattern in enumerate(redactor.compiled_patterns):
        matches = pattern.findall(test_text)
        if matches:
            patterns_found.append((redactor.patterns[i], matches))
            print(f"✓ Pattern '{redactor.patterns[i]}' found matches: {matches}")
    
    if patterns_found:
        print(f"\n✓ Successfully detected {len(patterns_found)} pattern types")
        return True
    else:
        print("\n✗ No patterns detected")
        return False

def test_redactor_initialization():
    """Test redactor initialization and configuration"""
    print("\n=== Testing Redactor Initialization ===")
    
    try:
        # Test default initialization
        redactor = PDFRedactor()
        print(f"✓ Default redactor created with {len(redactor.patterns)} patterns")
        
        # Test custom patterns
        custom_patterns = [r"\btest\b", r"\d{4}"]
        custom_redactor = PDFRedactor(custom_patterns)
        print(f"✓ Custom redactor created with {len(custom_redactor.patterns)} patterns")
        
        # Test factory function
        factory_redactor = create_redactor()
        print(f"✓ Factory redactor created with {len(factory_redactor.patterns)} patterns")
        
        return True
    except Exception as e:
        print(f"✗ Redactor initialization failed: {e}")
        return False

def test_pdf_redactor_availability():
    """Test pdf-redactor library availability"""
    print("\n=== Testing PDF-Redactor Library ===")
    
    try:
        import pdf_redactor
        print("✓ pdf-redactor library is available")
        return True
    except ImportError as e:
        print(f"✗ pdf-redactor library not available: {e}")
        return False

def test_pymupdf_availability():
    """Test PyMuPDF library availability"""
    print("\n=== Testing PyMuPDF Library ===")
    
    try:
        import fitz
        print("✓ PyMuPDF (fitz) library is available")
        return True
    except ImportError as e:
        print(f"✗ PyMuPDF library not available: {e}")
        return False

def main():
    """Run all integration tests"""
    print("Enhanced PDF Redaction System Integration Test")
    print("=" * 50)
    
    tests = [
        test_redactor_initialization,
        test_pattern_matching,
        test_pdf_redactor_availability,
        test_pymupdf_availability
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"✗ Test {test.__name__} failed with exception: {e}")
            failed += 1
    
    print("\n" + "=" * 50)
    print(f"Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("✓ All tests passed! Enhanced redaction system is ready.")
        return 0
    else:
        print("✗ Some tests failed. Please check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())