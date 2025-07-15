"""
Test suite for PDF redaction functionality
"""

import pytest
import re
import sys
import os
from pathlib import Path

# Add server directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'server'))

from redaction import PDFRedactor, create_redactor, redact_pdf_bytes
from sensitive_patterns import DEFAULT_PATTERNS, IMPORT_REGEXES

class TestPDFRedactor:
    """Test cases for PDFRedactor class"""
    
    def test_redactor_initialization(self):
        """Test redactor initialization with default patterns"""
        redactor = PDFRedactor()
        assert redactor.patterns == DEFAULT_PATTERNS
        assert len(redactor.compiled_patterns) == len(DEFAULT_PATTERNS)
        assert redactor.replacement_char == "█"
    
    def test_redactor_custom_patterns(self):
        """Test redactor with custom patterns"""
        custom_patterns = [r"\btest\b", r"\d{4}"]
        redactor = PDFRedactor(custom_patterns)
        assert redactor.patterns == custom_patterns
        assert len(redactor.compiled_patterns) == 2
    
    def test_content_filters_creation(self):
        """Test content filters creation"""
        patterns = [r"\bA\d{8}\b", r"\d{3}-\d{2}-\d{4}"]
        redactor = PDFRedactor(patterns)
        filters = redactor._create_content_filters()
        
        assert len(filters) == 2
        assert all(hasattr(f[0], 'pattern') for f in filters)
        assert all(callable(f[1]) for f in filters)
    
    def test_factory_function(self):
        """Test factory function"""
        redactor = create_redactor()
        assert isinstance(redactor, PDFRedactor)
        assert redactor.patterns == DEFAULT_PATTERNS
    
    def test_custom_factory_function(self):
        """Test factory function with custom patterns"""
        custom_patterns = [r"\btest\b"]
        redactor = create_redactor(custom_patterns)
        assert isinstance(redactor, PDFRedactor)
        assert redactor.patterns == custom_patterns
    
    def test_empty_pdf_bytes(self):
        """Test handling of empty PDF bytes"""
        redactor = PDFRedactor()
        with pytest.raises(ValueError, match="Empty PDF bytes provided"):
            redactor.run(b"")
    
    def test_pattern_matching(self):
        """Test pattern matching functionality"""
        patterns = [r"\bA\d{8}\b", r"\d{3}-\d{2}-\d{4}"]
        redactor = PDFRedactor(patterns)
        
        # Test text with sensitive information
        test_text = "Document contains A12345678 and SSN 123-45-6789"
        
        # Check if patterns match
        a_number_pattern = redactor.compiled_patterns[0]
        ssn_pattern = redactor.compiled_patterns[1]
        
        assert a_number_pattern.search(test_text) is not None
        assert ssn_pattern.search(test_text) is not None
    
    def test_redaction_effectiveness_simulation(self):
        """Test redaction effectiveness with simulated data"""
        # Create a simple test to verify pattern detection
        patterns = [r"\bA\d{8}\b", r"\d{3}-\d{2}-\d{4}"]
        redactor = PDFRedactor(patterns)
        
        # Simulate text that should be redacted
        sensitive_text = "A12345678 and 123-45-6789"
        clean_text = "This is clean text with no sensitive information"
        
        # Check pattern detection
        sensitive_found = any(pattern.search(sensitive_text) for pattern in redactor.compiled_patterns)
        clean_found = any(pattern.search(clean_text) for pattern in redactor.compiled_patterns)
        
        assert sensitive_found is True
        assert clean_found is False

class TestSensitivePatterns:
    """Test cases for sensitive pattern definitions"""
    
    def test_a_number_pattern(self):
        """Test A-number pattern matching"""
        pattern = re.compile(r"\bA[0-9]{8}\b", re.IGNORECASE)
        
        # Should match
        assert pattern.search("A12345678") is not None
        assert pattern.search("Document A87654321 here") is not None
        
        # Should not match
        assert pattern.search("A123456789") is None  # Too long
        assert pattern.search("A1234567") is None    # Too short
        assert pattern.search("B12345678") is None   # Wrong prefix
    
    def test_ssn_pattern(self):
        """Test SSN pattern matching"""
        pattern = re.compile(r"\b\d{3}-\d{2}-\d{4}\b", re.IGNORECASE)
        
        # Should match
        assert pattern.search("123-45-6789") is not None
        assert pattern.search("SSN: 987-65-4321") is not None
        
        # Should not match
        assert pattern.search("123-456-7890") is None  # Wrong format
        assert pattern.search("12-34-5678") is None    # Too short
    
    def test_phone_pattern(self):
        """Test phone number pattern matching"""
        pattern = re.compile(r"\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b", re.IGNORECASE)
        
        # Should match
        assert pattern.search("123-456-7890") is not None
        assert pattern.search("123.456.7890") is not None
        assert pattern.search("123 456 7890") is not None
        
        # Should not match
        assert pattern.search("1234567890") is None    # No separators
        assert pattern.search("123-45-6789") is None   # Wrong format
    
    def test_email_pattern(self):
        """Test email pattern matching"""
        pattern = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", re.IGNORECASE)
        
        # Should match
        assert pattern.search("test@example.com") is not None
        assert pattern.search("user.name@domain.org") is not None
        assert pattern.search("contact+info@company.co.uk") is not None
        
        # Should not match
        assert pattern.search("invalid.email") is None
        assert pattern.search("@domain.com") is None
        assert pattern.search("test@") is None

class TestIntegration:
    """Integration tests for the redaction system"""
    
    def test_convenience_function(self):
        """Test convenience function with mock data"""
        # Since we can't test with real PDF bytes in unit tests,
        # we'll test the function signature and error handling
        with pytest.raises(ValueError):
            redact_pdf_bytes(b"")
    
    def test_import_regexes_coverage(self):
        """Test that all import regexes are properly defined"""
        assert len(IMPORT_REGEXES) > 0
        
        # Verify all patterns compile
        for pattern in IMPORT_REGEXES:
            try:
                re.compile(pattern, re.IGNORECASE)
            except re.error as e:
                pytest.fail(f"Pattern {pattern} failed to compile: {e}")
    
    def test_default_patterns_coverage(self):
        """Test default patterns include both import and legal patterns"""
        assert len(DEFAULT_PATTERNS) >= len(IMPORT_REGEXES)
        
        # Verify all patterns are strings
        for pattern in DEFAULT_PATTERNS:
            assert isinstance(pattern, str)
            assert len(pattern) > 0

if __name__ == "__main__":
    pytest.main([__file__, "-v"])