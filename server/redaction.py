"""
PDF Redaction Engine using pdf-redactor
Provides robust redaction of sensitive information from PDF documents
"""

import re
import io
import tempfile
import logging
from typing import List, Tuple, Optional
import fitz  # PyMuPDF

try:
    import pdf_redactor
except ImportError:
    pdf_redactor = None

from sensitive_patterns import get_redaction_patterns, compile_patterns

logger = logging.getLogger(__name__)

class PDFRedactor:
    """
    PDF redaction engine using pdf-redactor with PyMuPDF fallback
    """
    
    def __init__(self, patterns: Optional[List[str]] = None):
        """
        Initialize PDFRedactor with redaction patterns
        
        Args:
            patterns (list, optional): List of regex patterns. Uses default if None.
        """
        self.patterns = patterns or get_redaction_patterns()
        self.compiled_patterns = compile_patterns(self.patterns)
        self.replacement_char = "█"
        
    def _create_content_filters(self) -> List[Tuple]:
        """
        Create content filters for pdf-redactor
        
        Returns:
            list: List of (regex, replacement_function) tuples
        """
        filters = []
        for pattern in self.patterns:
            # Create replacement function that replaces with blocks
            def make_replacement(match):
                return self.replacement_char * len(match.group(0))
            
            filters.append((re.compile(pattern, re.IGNORECASE), make_replacement))
        
        return filters
    
    def _redact_with_pdf_redactor(self, pdf_bytes: bytes) -> bytes:
        """
        Redact PDF using pdf-redactor library
        
        Args:
            pdf_bytes (bytes): Input PDF bytes
            
        Returns:
            bytes: Redacted PDF bytes
        """
        if not pdf_redactor:
            raise ImportError("pdf-redactor library not available")
        
        # Configure redaction options
        options = pdf_redactor.RedactorOptions()
        options.content_filters = self._create_content_filters()
        
        # Always wipe metadata for privacy
        options.metadata_filters = [(re.compile(r".*"), "")]
        
        # Create output buffer
        output = io.BytesIO()
        
        try:
            # Run redaction
            pdf_redactor.redactor(options, pdf_bytes, output)
            return output.getvalue()
        except Exception as e:
            logger.error(f"pdf-redactor failed: {e}")
            raise
    
    def _redact_with_pymupdf(self, pdf_bytes: bytes) -> bytes:
        """
        Fallback redaction using PyMuPDF rectangle overlay
        
        Args:
            pdf_bytes (bytes): Input PDF bytes
            
        Returns:
            bytes: Redacted PDF bytes
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        try:
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # Get text with positions
                text_dict = page.get_text("dict")
                
                # Find sensitive text and redact
                for block in text_dict["blocks"]:
                    if "lines" in block:
                        for line in block["lines"]:
                            for span in line["spans"]:
                                text = span["text"]
                                
                                # Check against patterns
                                for pattern in self.compiled_patterns:
                                    matches = pattern.finditer(text)
                                    for match in matches:
                                        # Calculate approximate position
                                        start_pos = match.start()
                                        end_pos = match.end()
                                        
                                        # Create redaction rectangle
                                        bbox = span["bbox"]
                                        char_width = (bbox[2] - bbox[0]) / len(text) if text else 0
                                        
                                        redact_x0 = bbox[0] + start_pos * char_width
                                        redact_x1 = bbox[0] + end_pos * char_width
                                        redact_rect = fitz.Rect(redact_x0, bbox[1], redact_x1, bbox[3])
                                        
                                        # Add redaction annotation
                                        page.add_redact_annot(redact_rect, fill=(0, 0, 0))
                
                # Apply redactions
                page.apply_redactions()
            
            # Return redacted PDF
            output = io.BytesIO()
            doc.save(output)
            return output.getvalue()
        
        finally:
            doc.close()
    
    def run(self, pdf_bytes: bytes, use_fallback: bool = True) -> bytes:
        """
        Run PDF redaction with primary method and fallback
        
        Args:
            pdf_bytes (bytes): Input PDF bytes
            use_fallback (bool): Whether to use PyMuPDF fallback on failure
            
        Returns:
            bytes: Redacted PDF bytes
        """
        if not pdf_bytes:
            raise ValueError("Empty PDF bytes provided")
        
        # Try pdf-redactor first
        if pdf_redactor:
            try:
                logger.info("Attempting redaction with pdf-redactor")
                return self._redact_with_pdf_redactor(pdf_bytes)
            except Exception as e:
                logger.warning(f"pdf-redactor failed: {e}")
                if not use_fallback:
                    raise
        
        # Fall back to PyMuPDF
        if use_fallback:
            logger.info("Using PyMuPDF fallback redaction")
            return self._redact_with_pymupdf(pdf_bytes)
        
        raise RuntimeError("No redaction method available")
    
    def test_redaction(self, pdf_bytes: bytes) -> dict:
        """
        Test redaction effectiveness by checking for patterns in output
        
        Args:
            pdf_bytes (bytes): Redacted PDF bytes
            
        Returns:
            dict: Test results with found patterns
        """
        # Extract text from redacted PDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        
        try:
            for page_num in range(len(doc)):
                page = doc[page_num]
                text += page.get_text()
        finally:
            doc.close()
        
        # Check for remaining sensitive patterns
        found_patterns = {}
        for i, pattern in enumerate(self.compiled_patterns):
            matches = pattern.findall(text)
            if matches:
                found_patterns[self.patterns[i]] = matches
        
        return {
            "text_length": len(text),
            "found_patterns": found_patterns,
            "redaction_effective": len(found_patterns) == 0
        }

def create_redactor(patterns: Optional[List[str]] = None) -> PDFRedactor:
    """
    Factory function to create PDFRedactor instance
    
    Args:
        patterns (list, optional): Custom patterns, uses default if None
        
    Returns:
        PDFRedactor: Configured redactor instance
    """
    return PDFRedactor(patterns)

def redact_pdf_bytes(pdf_bytes: bytes, patterns: Optional[List[str]] = None) -> bytes:
    """
    Convenience function to redact PDF bytes
    
    Args:
        pdf_bytes (bytes): Input PDF bytes
        patterns (list, optional): Custom patterns, uses default if None
        
    Returns:
        bytes: Redacted PDF bytes
    """
    redactor = create_redactor(patterns)
    return redactor.run(pdf_bytes)