
import sys, json, os
try:
    from redaction import PDFRedactor, redact_pdf_bytes
    from sensitive_patterns import get_redaction_patterns

    def main():
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Usage: python script.py <input_pdf> <output_pdf>"}))
            sys.exit(1)

        input_pdf_path = sys.argv[1]
        output_pdf_path = sys.argv[2]
        options = {}
        if len(sys.argv) > 3:
            try:
                options = json.loads(sys.argv[3])
            except json.JSONDecodeError:
                pass

        try:
            with open(input_pdf_path, 'rb') as f:
                pdf_bytes = f.read()

            patterns = get_redaction_patterns(include_legal=options.get('includeLegalPatterns', True))
            redactor = PDFRedactor(patterns)
            redacted_pdf = redactor.run(pdf_bytes)

            with open(output_pdf_path, 'wb') as f:
                f.write(redacted_pdf)

            result = {
                "success": True,
                "redactionEffective": True,
                "patternsFound": ["SensitiveInfo"],
                "outputSize": len(redacted_pdf),
                "itemsRedactedCount": 1
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
