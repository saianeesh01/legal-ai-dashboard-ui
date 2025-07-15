
import sys
import json
import os
import tempfile
from pathlib import Path

# Add server directory to path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from redaction import PDFRedactor, redact_pdf_bytes
    from sensitive_patterns import get_redaction_patterns, DEFAULT_PATTERNS
    
    def main():
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Usage: python script.py <input_pdf> <output_pdf> [options]"}))
            sys.exit(1)
        
        input_pdf_path = sys.argv[1]
        output_pdf_path = sys.argv[2]
        
        # Parse options if provided
        options = {}
        if len(sys.argv) > 3:
            try:
                options = json.loads(sys.argv[3])
            except json.JSONDecodeError:
                pass
        
        try:
            # Read input PDF
            with open(input_pdf_path, 'rb') as f:
                pdf_bytes = f.read()
            
            # Configure patterns
            patterns = None
            if options.get('customPatterns'):
                patterns = options['customPatterns']
            elif options.get('includeLegalPatterns', True):
                patterns = get_redaction_patterns(include_legal=True)
            else:
                patterns = get_redaction_patterns(include_legal=False)
            
            # Create redactor and process
            redactor = PDFRedactor(patterns)
            redacted_pdf = redactor.run(pdf_bytes)
            
            # Test redaction effectiveness
            test_result = redactor.test_redaction(redacted_pdf)
            
            # Write output
            with open(output_pdf_path, 'wb') as f:
                f.write(redacted_pdf)
            
            # Return results
            result = {
                "success": True,
                "redactionEffective": test_result['redaction_effective'],
                "textLength": test_result['text_length'],
                "patternsFound": list(test_result['found_patterns'].keys()) if test_result['found_patterns'] else [],
                "outputSize": len(redacted_pdf)
            }
            
            print(json.dumps(result))
            
        except Exception as e:
            print(json.dumps({"error": str(e), "success": False}))
            sys.exit(1)
    
    if __name__ == "__main__":
        main()
        
except ImportError as e:
    print(json.dumps({"error": f"Import error: {e}", "success": False}))
    sys.exit(1)
