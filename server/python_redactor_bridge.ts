/**
 * Bridge service to integrate Python pdf-redactor with Node.js backend
 * Provides enhanced redaction capabilities using the pdf-redactor library
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface RedactionOptions {
  useAdvancedRedaction?: boolean;
  customPatterns?: string[];
  includeLegalPatterns?: boolean;
}

interface RedactionResult {
  success: boolean;
  redactedPdfBuffer?: Buffer;
  error?: string;
  patternsFound?: string[];
  redactionEffective?: boolean;
}

export class PythonRedactorBridge {
  private pythonScript: string;
  
  constructor() {
    this.pythonScript = join(__dirname, 'redaction_service.py');
    this.createPythonScript();
  }
  
  private createPythonScript(): void {
    const scriptContent = `
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
`;
    
    writeFileSync(this.pythonScript, scriptContent);
  }
  
  async redactPDF(pdfBuffer: Buffer, options: RedactionOptions = {}): Promise<RedactionResult> {
    const tempDir = tmpdir();
    const inputFile = join(tempDir, `input_${crypto.randomUUID()}.pdf`);
    const outputFile = join(tempDir, `output_${crypto.randomUUID()}.pdf`);
    
    try {
      // Write input PDF to temporary file
      writeFileSync(inputFile, pdfBuffer);
      
      // Prepare options for Python script
      const pythonOptions = {
        customPatterns: options.customPatterns,
        includeLegalPatterns: options.includeLegalPatterns ?? true
      };
      
      // Execute Python redaction script
      const result = await this.executePythonScript(inputFile, outputFile, pythonOptions);
      
      if (result.success) {
        // Read redacted PDF
        const redactedPdfBuffer = readFileSync(outputFile);
        
        return {
          success: true,
          redactedPdfBuffer,
          patternsFound: result.patternsFound,
          redactionEffective: result.redactionEffective
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      // Clean up temporary files
      try {
        unlinkSync(inputFile);
        unlinkSync(outputFile);
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary files:', cleanupError);
      }
    }
  }
  
  private executePythonScript(inputFile: string, outputFile: string, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const optionsStr = JSON.stringify(options);
      const python = spawn('python3', [this.pythonScript, inputFile, outputFile, optionsStr]);
      
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse Python output: ${stdout}`));
          }
        } else {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });
      
      python.on('error', (error) => {
        reject(error);
      });
    });
  }
  
  async testRedaction(pdfBuffer: Buffer, patterns?: string[]): Promise<{
    hasANumbers: boolean;
    hasSSNs: boolean;
    hasPhoneNumbers: boolean;
    hasEmails: boolean;
    totalSensitiveItems: number;
  }> {
    const result = await this.redactPDF(pdfBuffer, { customPatterns: patterns });
    
    if (!result.success) {
      throw new Error(`Redaction test failed: ${result.error}`);
    }
    
    const foundPatterns = result.patternsFound || [];
    
    return {
      hasANumbers: foundPatterns.some(p => p.includes('A[0-9]')),
      hasSSNs: foundPatterns.some(p => p.includes('\\d{3}-\\d{2}-\\d{4}')),
      hasPhoneNumbers: foundPatterns.some(p => p.includes('\\d{3}[-.\s]\\d{3}[-.\s]\\d{4}')),
      hasEmails: foundPatterns.some(p => p.includes('@')),
      totalSensitiveItems: foundPatterns.length
    };
  }
}

// Singleton instance
export const pythonRedactorBridge = new PythonRedactorBridge();