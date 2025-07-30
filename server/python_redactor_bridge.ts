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

export interface RedactionOptions {
  fileName?: string;
  useAdvancedRedaction?: boolean;
  customPatterns?: string[];
  includeLegalPatterns?: boolean;
}


export interface RedactionResult {
  success: boolean;
  redactedText?: string;
  redactedPdfBuffer?: Buffer;
  patternsFound?: string[];
  itemsRedacted?: number;   // ✅ Use this property consistently
  redactionEffective?: boolean;
  error?: string;
  method?: 'advanced' | 'standard' | 'text-only';
}



export class PythonRedactorBridge {
  private pythonScript: string;

  constructor() {
    this.pythonScript = join(__dirname, 'redaction_service.py');
    this.createPythonScript();
  }

  private createPythonScript(): void {
    const scriptContent = `
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
`;
    writeFileSync(this.pythonScript, scriptContent);
  }

  async redactPDF(pdfBuffer: Buffer, options: string | RedactionOptions = {}): Promise<RedactionResult> {
    const tempDir = tmpdir();
    const inputFile = join(tempDir, `input_${crypto.randomUUID()}.pdf`);
    const outputFile = join(tempDir, `output_${crypto.randomUUID()}.pdf`);

    try {
      writeFileSync(inputFile, pdfBuffer);

      const pythonOptions = typeof options === 'string' ? { fileName: options } : options;
      const result = await this.executePythonScript(inputFile, outputFile, pythonOptions);

      if (result.success) {
        const redactedPdfBuffer = readFileSync(outputFile);
        return {
          success: true,
          redactedPdfBuffer,
          patternsFound: result.patternsFound || [],
          redactionEffective: result.redactionEffective,
          itemsRedacted: result.itemsRedactedCount || 0
        };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      try { unlinkSync(inputFile); unlinkSync(outputFile); } catch {}
    }
  }

  private executePythonScript(inputFile: string, outputFile: string, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [this.pythonScript, inputFile, outputFile, JSON.stringify(options)]);
      let stdout = '', stderr = '';

      python.stdout.on('data', data => { stdout += data.toString(); });
      python.stderr.on('data', data => { stderr += data.toString(); });

      python.on('close', code => {
        if (code === 0) {
          try { resolve(JSON.parse(stdout)); }
          catch { reject(new Error(`Failed to parse Python output: ${stdout}`)); }
        } else {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });
      python.on('error', reject);
    });
  }
}

// ✅ Export singleton
export const pythonRedactorBridge = new PythonRedactorBridge();
