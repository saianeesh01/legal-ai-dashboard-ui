import { PDFExtractor, type PDFExtractionResult } from './pdf_extractor.js';
import { pythonRedactorBridge } from './python_redactor_bridge.js';

export interface RedactionResult {
  success: boolean;
  redactedText?: string;
  redactedPdfBuffer?: Buffer;
  patternsFound?: string[];
  itemsRedactedCount?: number;
  error?: string;
}

export class PDFRedactor {
  private static readonly DEFAULT_PATTERNS = [
    { name: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN REDACTED]' },
    { name: 'Phone', pattern: /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g, replacement: '[PHONE REDACTED]' },
    { name: 'Email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL REDACTED]' },
  ];

  /**
   * ✅ Main method: Attempts Python redactor first, then falls back to standard.
   */
  static async redactPDF(buffer: Buffer, fileName: string, useAdvanced = true): Promise<RedactionResult> {
    try {
      if (useAdvanced) {
        const result = await pythonRedactorBridge.redactPDF(buffer, {
          includeLegalPatterns: true
        });
        if (result.success) {
          return {
            ...result,
            redactedPdfBuffer: result.redactedPdfBuffer,
            patternsFound: result.patternsFound ?? [],
            itemsRedactedCount: result.itemsRedacted ?? 0
          };
        }
      }
      return this.standardRedaction(buffer, fileName);
    } catch (error: any) {
      return { success: false, error: error.message || 'Redaction failed' };
    }
  }

  /**
   * ✅ Fallback text-based redaction.
   */
  private static async standardRedaction(buffer: Buffer, fileName: string): Promise<RedactionResult> {
    try {
      const extraction: PDFExtractionResult = await PDFExtractor.extractText(buffer, fileName);
      if (!extraction.success || !extraction.hasValidContent) {
        return { success: false, error: 'Text extraction failed', patternsFound: [], itemsRedactedCount: 0 };
      }

      let text = extraction.text;
      const found: string[] = [];
      let count = 0;

      for (const pattern of this.DEFAULT_PATTERNS) {
        const matches = text.match(pattern.pattern);
        if (matches) {
          found.push(pattern.name);
          count += matches.length;
          text = text.replace(pattern.pattern, pattern.replacement);
        }
      }

      return { success: true, redactedText: text, patternsFound: found, itemsRedactedCount: count };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * ✅ Validate extracted text before AI processing.
   */
  static validateTextForAI(text: string): { isValid: boolean; reason?: string; wordCount: number } {
    if (!text || text.trim().length === 0) {
      return { isValid: false, reason: 'Empty text', wordCount: 0 };
    }

    const words = text.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;

    if (wordCount < 10) {
      return { isValid: false, reason: 'Insufficient content (less than 10 words)', wordCount };
    }

    const alphabeticChars = (text.match(/[a-zA-Z]/g) || []).length;
    const alphabeticRatio = alphabeticChars / text.length;

    if (alphabeticRatio < 0.3) {
      return { isValid: false, reason: 'Text appears corrupted (low alphabetic ratio)', wordCount };
    }

    return { isValid: true, wordCount };
  }
}

export default PDFRedactor;
