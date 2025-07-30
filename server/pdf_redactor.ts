/**
 * Enhanced PDF redaction system compatible with Node.js 22
 * Integrates with pdf_extractor_v2.ts for comprehensive document processing
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PDFExtractor, type PDFExtractionResult } from './pdf_extractor.js';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface RedactionResult {
  success: boolean;
  redactedPDFBuffer?: Buffer;
  redactedText?: string;
  patternsFound: string[];
  itemsRedacted: number;
  error?: string;
  method: 'advanced' | 'standard' | 'text-only';
}

export interface RedactionPattern {
  name: string;
  pattern: RegExp;
  replacement: string;
}

export class PDFRedactor {
  private static readonly DEFAULT_PATTERNS: RedactionPattern[] = [
    {
      name: 'A-Number',
      pattern: /\bA[0-9]{8}\b/g,
      replacement: '[A-NUMBER REDACTED]'
    },
    {
      name: 'SSN',
      pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
      replacement: '[SSN REDACTED]'
    },
    {
      name: 'Phone Number',
      pattern: /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g,
      replacement: '[PHONE REDACTED]'
    },
    {
      name: 'Email Address',
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: '[EMAIL REDACTED]'
    },
    {
      name: 'Street Address',
      pattern: /\b[0-9]{1,5}\s[A-Za-z].{5,30}(Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?)\b/gi,
      replacement: '[ADDRESS REDACTED]'
    },
    {
      name: 'ZIP Code',
      pattern: /\b\d{5}(-\d{4})?\b/g,
      replacement: '[ZIP REDACTED]'
    },
    {
      name: 'Credit Card',
      pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      replacement: '[CREDIT CARD REDACTED]'
    },
    {
      name: 'Legal Case Number',
      pattern: /\b(Case|Docket|File)\s*(No\.?|Number)?\s*:?\s*[A-Za-z0-9-]+\b/gi,
      replacement: '[CASE NUMBER REDACTED]'
    }
  ];

  /**
   * Advanced redaction using Python pdf-redactor bridge
   */
  private static async advancedRedaction(buffer: Buffer, fileName: string): Promise<RedactionResult> {
    try {
      // Try to use the Python bridge for advanced redaction
      const { PythonRedactorBridge } = await import('./python_redactor_bridge.js');
      const bridge = new PythonRedactorBridge();
      
      const result = await bridge.redactPDF(buffer, fileName);
      
      if (result.success && result.redactedPdfBuffer) {
        return {
          success: true,
          redactedPDFBuffer: result.redactedPdfBuffer,
          patternsFound: result.patternsFound || [],
          itemsRedacted: result.itemsRedactedCount || 0,
          method: 'advanced'
        };
      } else {
        throw new Error(result.error || 'Advanced redaction failed');
      }
    } catch (error: any) {
      console.warn('Advanced redaction failed, falling back to standard method:', error?.message || error);
      return this.standardRedaction(buffer, fileName);
    }
  }

  /**
   * Standard redaction using text extraction and pattern replacement
   */
  private static async standardRedaction(buffer: Buffer, fileName: string): Promise<RedactionResult> {
    try {
      // Extract text using the new PDF extractor
      const extractionResult: PDFExtractionResult = await PDFExtractor.extractText(buffer, fileName);
      
      if (!extractionResult.success || !extractionResult.hasValidContent) {
        return {
          success: false,
          patternsFound: [],
          itemsRedacted: 0,
          error: 'Text extraction failed - cannot perform redaction',
          method: 'standard'
        };
      }

      let redactedText = extractionResult.text;
      const patternsFound: string[] = [];
      let totalItemsRedacted = 0;

      // Apply redaction patterns
      for (const pattern of this.DEFAULT_PATTERNS) {
        const matches = redactedText.match(pattern.pattern);
        if (matches && matches.length > 0) {
          patternsFound.push(pattern.name);
          totalItemsRedacted += matches.length;
          redactedText = redactedText.replace(pattern.pattern, pattern.replacement);
        }
      }

      return {
        success: true,
        redactedText,
        patternsFound,
        itemsRedacted: totalItemsRedacted,
        method: 'standard'
      };
    } catch (error: any) {
      return {
        success: false,
        patternsFound: [],
        itemsRedacted: 0,
        error: error?.message || String(error),
        method: 'standard'
      };
    }
  }

  /**
   * Text-only redaction for already extracted text
   */
  static redactText(text: string, customPatterns?: RedactionPattern[]): RedactionResult {
    const patterns = customPatterns || this.DEFAULT_PATTERNS;
    let redactedText = text;
    const patternsFound: string[] = [];
    let totalItemsRedacted = 0;

    for (const pattern of patterns) {
      const matches = redactedText.match(pattern.pattern);
      if (matches && matches.length > 0) {
        patternsFound.push(pattern.name);
        totalItemsRedacted += matches.length;
        redactedText = redactedText.replace(pattern.pattern, pattern.replacement);
      }
    }

    return {
      success: true,
      redactedText,
      patternsFound,
      itemsRedacted: totalItemsRedacted,
      method: 'text-only'
    };
  }

  /**
   * Main redaction method with mode selection
   */
  static async redactPDF(buffer: Buffer, fileName: string, useAdvanced: boolean = false): Promise<RedactionResult> {
    console.log(`Starting PDF redaction for: ${fileName} (Advanced: ${useAdvanced})`);

    if (useAdvanced) {
      const advancedResult = await this.advancedRedaction(buffer, fileName);
      if (advancedResult.success) {
        console.log(`✓ Advanced redaction successful: ${advancedResult.itemsRedacted} items redacted`);
        return advancedResult;
      }
      console.log('Advanced redaction failed, falling back to standard redaction');
    }

    const standardResult = await this.standardRedaction(buffer, fileName);
    if (standardResult.success) {
      console.log(`✓ Standard redaction successful: ${standardResult.itemsRedacted} items redacted`);
    } else {
      console.log('Standard redaction failed:', standardResult.error);
    }

    return standardResult;
  }

  /**
   * Validate extracted text before sending to AI
   */
  static validateTextForAI(text: string): { isValid: boolean; reason?: string; wordCount: number } {
    if (!text || text.trim().length === 0) {
      return { isValid: false, reason: 'Empty text', wordCount: 0 };
    }

    const words = text.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;

    // Check minimum word count
    if (wordCount < 10) {
      return { isValid: false, reason: 'Insufficient content (less than 10 words)', wordCount };
    }

    // Check for corruption patterns
    const alphabeticChars = (text.match(/[a-zA-Z]/g) || []).length;
    const totalChars = text.length;
    const alphabeticRatio = alphabeticChars / totalChars;

    if (alphabeticRatio < 0.3) {
      return { isValid: false, reason: 'Text appears corrupted (low alphabetic ratio)', wordCount };
    }

    // Check for excessive repetition
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const uniqueRatio = uniqueWords.size / words.length;

    if (uniqueRatio < 0.1) {
      return { isValid: false, reason: 'Text has excessive repetition', wordCount };
    }

    return { isValid: true, wordCount };
  }

  /**
   * Prepare text for AI summarization with chunking
   */
  static prepareTextForAI(text: string, maxChunkSize: number = 4000): {
    isValid: boolean;
    chunks: string[];
    totalWords: number;
    validation: { isValid: boolean; reason?: string; wordCount: number };
  } {
    const validation = this.validateTextForAI(text);
    
    if (!validation.isValid) {
      return {
        isValid: false,
        chunks: [],
        totalWords: validation.wordCount,
        validation
      };
    }

    const chunks = PDFExtractor.chunkText(text, maxChunkSize);
    
    return {
      isValid: true,
      chunks,
      totalWords: validation.wordCount,
      validation
    };
  }
}