/**
 * Robust PDF Text Extraction System
 * Multiple extraction methods with comprehensive error handling
 */

// Simple PDF text extraction without external dependencies
// const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

interface PDFExtractionResult {
  text: string;
  pageCount: number;
  extractionMethod: string;
  success: boolean;
  error?: string;
}

export class PDFExtractor {
  
  /**
   * Extract text from PDF buffer using robust buffer parsing
   */
  static async extractText(buffer: Buffer, fileName: string): Promise<PDFExtractionResult> {
    console.log(`Starting PDF extraction for: ${fileName}`);
    
    // Method 1: Advanced buffer text extraction
    try {
      const result = await this.extractWithBuffer(buffer);
      if (result.success && result.text.length > 100) {
        console.log(`Buffer extraction successful: ${result.text.length} characters`);
        return result;
      }
    } catch (error) {
      console.log(`Buffer extraction failed:`, error);
    }
    
    // Method 2: Simple text search
    try {
      const result = await this.extractWithSimpleSearch(buffer);
      if (result.success && result.text.length > 50) {
        console.log(`Simple search successful: ${result.text.length} characters`);
        return result;
      }
    } catch (error) {
      console.log(`Simple search failed:`, error);
    }
    
    console.log(`All extraction methods failed for ${fileName}`);
    return {
      text: '',
      pageCount: 0,
      extractionMethod: 'failed',
      success: false,
      error: 'All extraction methods failed'
    };
  }
  
  /**
   * Extract text using simple text search patterns
   */
  private static async extractWithSimpleSearch(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      console.log('Starting simple text search extraction...');
      const text = buffer.toString('binary');
      
      // Look for readable text patterns
      const readableText = text.match(/[\x20-\x7E]+/g);
      if (!readableText) {
        return {
          text: '',
          pageCount: 0,
          extractionMethod: 'simple',
          success: false,
          error: 'No readable text found'
        };
      }
      
      // Filter and clean readable segments
      const cleanSegments = readableText
        .filter(segment => segment.length > 5)
        .filter(segment => /[a-zA-Z]/.test(segment))
        .map(segment => segment.trim())
        .filter(segment => segment.length > 0);
      
      const extractedText = cleanSegments.join(' ').replace(/\s+/g, ' ').trim();
      
      console.log(`Simple search found ${cleanSegments.length} text segments`);
      
      return {
        text: extractedText,
        pageCount: 1,
        extractionMethod: 'simple',
        success: extractedText.length > 0
      };
      
    } catch (error) {
      console.error('Simple search failed:', error);
      return {
        text: '',
        pageCount: 0,
        extractionMethod: 'simple',
        success: false,
        error: `Simple search failed: ${error.message}`
      };
    }
  }
  
  /**
   * Extract text using advanced buffer parsing with comprehensive patterns
   */
  private static async extractWithBuffer(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      console.log('Starting buffer-based extraction...');
      const text = buffer.toString('utf8');
      
      // Advanced text patterns in PDF structure
      const textPatterns = [
        /\(([^)]+)\)/g,  // Text in parentheses
        /\/Title\s*\(([^)]+)\)/g,  // Title field
        /\/Subject\s*\(([^)]+)\)/g,  // Subject field
        /\/Author\s*\(([^)]+)\)/g,  // Author field
        /BT\s+([^ET]+)\s+ET/g,  // Text objects
        /Tj\s*\[([^\]]+)\]/g,  // Text positioning
        /\[\(([^)]+)\)\]/g,  // Array text
        /\/Contents\s*\(([^)]+)\)/g,  // Contents field
        /stream\s+([^e]+)endstream/g,  // Stream objects
        /Tf\s+([^T]+)Tj/g,  // Text with font
      ];
      
      let extractedText = '';
      let totalMatches = 0;
      
      textPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const cleaned = match
              .replace(/[()]/g, '')
              .replace(/\\[rn]/g, ' ')
              .replace(/\s+/g, ' ')
              .replace(/[^\x20-\x7E]/g, ' ')  // Remove non-printable chars
              .trim();
            if (cleaned.length > 3 && /[a-zA-Z]/.test(cleaned)) {
              extractedText += cleaned + ' ';
              totalMatches++;
            }
          });
        }
      });
      
      console.log(`Buffer extraction found ${totalMatches} text segments`);
      
      const finalText = extractedText.trim();
      return {
        text: finalText,
        pageCount: 1,
        extractionMethod: 'buffer',
        success: finalText.length > 0
      };
      
    } catch (error) {
      console.error('Buffer extraction failed:', error);
      return {
        text: '',
        pageCount: 0,
        extractionMethod: 'buffer',
        success: false,
        error: `Buffer extraction failed: ${error.message}`
      };
    }
  }
  
  /**
   * Validate extracted text quality
   */
  static validateTextQuality(text: string): boolean {
    if (!text || text.length < 50) return false;
    
    // Check for reasonable text characteristics
    const words = text.split(/\s+/).filter(word => word.length > 1);
    const wordCount = words.length;
    const charCount = text.length;
    const avgWordLength = charCount / wordCount;
    
    // Check for corrupted text patterns
    const corruptedPatterns = [
      /\b[A-Z]{1}\s+[A-Z]{1}\s+[A-Z]{1}/g,  // Scattered single letters
      /\b\w{1}\s+\w{1}\s+\w{1}/g,  // Single chars with spaces
      /[^\w\s.,!?;:()\-$%/@]{3,}/g  // Multiple strange characters
    ];
    
    const hasCorruption = corruptedPatterns.some(pattern => pattern.test(text));
    if (hasCorruption) {
      console.log('Text quality check failed: corrupted patterns detected');
      return false;
    }
    
    // Basic quality metrics
    const hasLetters = /[a-zA-Z]/.test(text);
    const hasWords = wordCount > 10;
    const reasonableWordLength = avgWordLength > 2 && avgWordLength < 20;
    const hasReadableWords = words.filter(word => /^[a-zA-Z]+$/.test(word)).length > wordCount * 0.5;
    
    return hasLetters && hasWords && reasonableWordLength && hasReadableWords;
  }
  
  /**
   * Clean extracted text for analysis
   */
  static cleanExtractedText(text: string): string {
    return text
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/[^\x20-\x7E]/g, ' ')  // Remove non-printable characters
      .replace(/[^\w\s.,!?;:()\-$%/@]/g, ' ')  // Remove strange characters but keep important symbols
      .replace(/\b[A-Z]{1}\s+[A-Z]{1}\s+[A-Z]{1}/g, ' ')  // Remove scattered single letters
      .replace(/\b\w{1}\s+\w{1}\s+\w{1}/g, ' ')  // Remove pattern of single chars with spaces
      .replace(/\s+/g, ' ')  // Normalize whitespace again
      .trim();
  }
}