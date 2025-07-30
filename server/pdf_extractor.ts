/**
 * Enhanced PDF text extraction compatible with pdfjs-dist 3.x and Node.js 22
 * Provides reliable text extraction for legal document analysis with validation
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type QualityType = 'high' | 'medium' | 'low' | 'failed';

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  extractionMethod: string;
  success: boolean;
  error?: string;
  quality: QualityType;
  wordCount: number;
  hasValidContent: boolean;
}

// Import pdfjs-dist using createRequire for Node.js compatibility
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function loadPDFJS() {
  try {
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
    return pdfjsLib;
  } catch (error) {
    console.error('Failed to load pdfjs-dist:', error);
    throw new Error('Could not load PDF.js library');
  }
}

export class PDFExtractor {
  /**
   * Validate extracted text quality
   */
  private static validateTextQuality(text: string): { quality: QualityType; wordCount: number; hasValidContent: boolean } {
    if (!text || text.trim().length === 0) {
      return { quality: 'failed', wordCount: 0, hasValidContent: false };
    }

    const words = text.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;

    const alphabeticChars = (text.match(/[a-zA-Z]/g) || []).length;
    const totalChars = text.length;
    const alphabeticRatio = alphabeticChars / totalChars;

    let quality: QualityType = 'low';
    if (wordCount >= 100 && alphabeticRatio > 0.7) {
      quality = 'high';
    } else if (wordCount >= 50 && alphabeticRatio > 0.5) {
      quality = 'medium';
    }

    const hasValidContent = wordCount >= 10 && alphabeticRatio > 0.3;
    return { quality, wordCount, hasValidContent };
  }

  /**
   * Enhanced PDF text extraction with better error handling
   */
  static async extractWithPDFJS(buffer: Buffer, fileName: string): Promise<PDFExtractionResult> {
    try {
      console.log(`🔍 Attempting enhanced pdfjs-dist extraction for: ${fileName}`);
      
      const lib = await loadPDFJS();
      const uint8Array = new Uint8Array(buffer);
      const pdf = await lib.getDocument({ 
        data: uint8Array,
        verbosity: 0, // Reduce console noise
        disableFontFace: true,
        useSystemFonts: false
      }).promise;

      let fullText = '';
      const pageCount = pdf.numPages;
      console.log(`📄 Processing ${pageCount} pages...`);

      for (let i = 1; i <= pageCount; i++) {
        try {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent({
            normalizeWhitespace: false
          });
          
          // Better text extraction with spacing
          const pageText = content.items
            .map((item: any) => {
              if (item.str && item.str.trim()) {
                return item.str;
              }
              return '';
            })
            .filter((text: string) => text.length > 0)
            .join(' ');
            
          if (pageText.trim()) {
            fullText += pageText + '\n\n';
            console.log(`✓ Page ${i}: extracted ${pageText.length} characters`);
          }
        } catch (pageError) {
          console.warn(`⚠️ Failed to extract page ${i}: ${pageError}`);
          continue;
        }
      }

      const cleanText = fullText.trim();
      const validation = this.validateTextQuality(cleanText);

      console.log(`📊 Extraction complete: ${cleanText.length} chars, ${validation.wordCount} words, quality: ${validation.quality}`);

      return {
        text: cleanText,
        pageCount: pageCount,
        extractionMethod: 'pdfjs-dist-enhanced',
        success: validation.hasValidContent,
        quality: validation.quality,
        wordCount: validation.wordCount,
        hasValidContent: validation.hasValidContent
      };
    } catch (error: any) {
      console.error(`❌ Enhanced pdfjs-dist extraction failed: ${error.message}`);
      return {
        text: '',
        pageCount: 0,
        extractionMethod: 'pdfjs-dist-enhanced',
        success: false,
        error: error?.message || String(error),
        quality: 'failed',
        wordCount: 0,
        hasValidContent: false
      };
    }
  }

  /**
   * Fallback extraction if pdfjs fails - should return contextual content instead of corrupted text
   */
  private static async fallbackTextExtraction(buffer: Buffer, fileName: string): Promise<PDFExtractionResult> {
    try {
      console.log('❌ Fallback extraction triggered - PDF parsing failed');
      console.log('✅ Using contextual content generation instead of corrupted text extraction');
      
      // Instead of trying to read binary PDF as text (which creates gibberish),
      // return contextual content based on filename
      return this.generateContextualContent(fileName);
    } catch (error: any) {
      return {
        text: '',
        pageCount: 0,
        extractionMethod: 'fallback-buffer',
        success: false,
        error: error?.message || String(error),
        quality: 'failed',
        wordCount: 0,
        hasValidContent: false
      };
    }
  }

  /**
   * Contextual text generation
   */
  private static generateContextualContent(fileName: string): PDFExtractionResult {
    const text = `Legal document: ${fileName}. This appears to be a legal or administrative document with case details.`;
    const validation = this.validateTextQuality(text);

    return {
      text,
      pageCount: 1,
      extractionMethod: 'contextual-generation',
      success: true,
      quality: validation.quality,
      wordCount: validation.wordCount,
      hasValidContent: true
    };
  }

  /**
   * Main extraction method - no fallbacks, real text or fail
   */
  static async extractText(buffer: Buffer, fileName: string): Promise<PDFExtractionResult> {
    console.log(`🚀 Starting robust PDF extraction for: ${fileName}`);
    
    // Enhanced pdfjs-dist extraction - no fallbacks
    const result = await this.extractWithPDFJS(buffer, fileName);
    
    if (result.success && result.hasValidContent) {
      console.log(`✅ Successfully extracted real text: ${result.wordCount} words`);
      return result;
    }
    
    console.log(`❌ Failed to extract valid text from ${fileName}`);
    console.log(`Error: ${result.error || 'Unknown extraction error'}`);
    
    // Return failure instead of fallback - no fake content
    return {
      text: '',
      pageCount: result.pageCount || 0,
      extractionMethod: result.extractionMethod,
      success: false,
      error: result.error || 'Could not extract valid text from PDF',
      quality: 'failed',
      wordCount: 0,
      hasValidContent: false
    };
  }

  /**
   * Chunk text for AI processing
   */
  static chunkText(text: string, maxChunkSize = 4000): string[] {
    if (text.length <= maxChunkSize) return [text];

    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      const potentialChunk = currentChunk + (currentChunk ? '. ' : '') + sentence;
      if (potentialChunk.length <= maxChunkSize) {
        currentChunk = potentialChunk;
      } else {
        chunks.push(currentChunk);
        currentChunk = sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    return chunks;
  }
}
