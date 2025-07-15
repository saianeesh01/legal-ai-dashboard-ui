"""
Sensitive pattern definitions for PDF redaction
Contains regex patterns for detecting and redacting sensitive information
"""

import re

# Default patterns for sensitive information detection
IMPORT_REGEXES = [
    r"\bA[0-9]{8}\b",                      # A-numbers (immigration)
    r"\b\d{3}-\d{2}-\d{4}\b",             # SSNs (xxx-xx-xxxx)
    r"\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b",   # US phones (xxx-xxx-xxxx)
    r"\b(?:19|20)\d{2}[/-]\d{2}[/-]\d{2}\b",  # DOB yyyy-mm-dd format
    r"\b[0-9]{1,3} [A-Za-z].{0,20}(Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?)\b",  # Street addresses
    r"\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b",  # Credit card numbers
    r"\b[A-Z]{2}\d{6,8}\b",                # Driver's license patterns
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",  # Email addresses
    r"\b\d{5}(-\d{4})?\b",                 # ZIP codes
    r"\b\d{3}-\d{3}-\d{4}\b",             # Phone numbers (xxx-xxx-xxxx)
    r"\b\(\d{3}\)\s?\d{3}-\d{4}\b",       # Phone numbers ((xxx) xxx-xxxx)
]

# Additional patterns for legal documents
LEGAL_PATTERNS = [
    r"\bCase\s+No\.?\s+[A-Z0-9-]+\b",     # Case numbers
    r"\bDocket\s+No\.?\s+[A-Z0-9-]+\b",   # Docket numbers
    r"\b[A-Z]{2,3}\s+\d{2,3}-\d{3,6}\b", # Court case formats
]

# Combined default pattern set
DEFAULT_PATTERNS = IMPORT_REGEXES + LEGAL_PATTERNS

def get_redaction_patterns(include_legal=True):
    """
    Get redaction patterns for PDF processing
    
    Args:
        include_legal (bool): Whether to include legal document patterns
    
    Returns:
        list: List of regex patterns for redaction
    """
    if include_legal:
        return DEFAULT_PATTERNS
    return IMPORT_REGEXES

def compile_patterns(patterns):
    """
    Compile regex patterns for efficient matching
    
    Args:
        patterns (list): List of regex pattern strings
    
    Returns:
        list: List of compiled regex objects
    """
    return [re.compile(pattern, re.IGNORECASE) for pattern in patterns]