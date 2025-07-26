/**
 * Comprehensive Document Text Extraction System
 * Supports PDF, DOCX, and other document formats with proper content extraction
 */

import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as tesseract from 'tesseract.js';

interface DocumentExtractionResult {
  text: string;
  pageCount: number;
  extractionMethod: string;
  success: boolean;
  error?: string;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

export class DocumentExtractor {
  
  /**
   * Extract text from any supported document format
   */
  static async extractText(buffer: Buffer, fileName: string, mimeType: string): Promise<DocumentExtractionResult> {
    console.log(`Starting document extraction for: ${fileName} (${mimeType})`);
    
    try {
      // Route to appropriate extractor based on MIME type
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPDF(buffer, fileName);
        
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.extractFromDOCX(buffer, fileName);
        
        case 'text/plain':
          return await this.extractFromText(buffer, fileName);
        
        case 'image/jpeg':
        case 'image/png':
        case 'image/gif':
        case 'image/bmp':
        case 'image/tiff':
          return await this.extractFromImage(buffer, fileName);
        
        default:
          console.log(`Unsupported file type: ${mimeType}, attempting text extraction`);
          return await this.extractFromText(buffer, fileName);
      }
    } catch (error) {
      console.error(`Document extraction failed for ${fileName}:`, error);
      return {
        text: '',
        pageCount: 0,
        extractionMethod: 'failed',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract text from PDF using pdf-parse
   */
  private static async extractFromPDF(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
    try {
      console.log(`Extracting PDF text from: ${fileName}`);
      
      const data = await pdfParse(buffer, {
        // Ensure we get the best text extraction
        normalizeWhitespace: true,
        disableCombineTextItems: false,
      });

      // Clean and validate the extracted text
      const cleanText = this.cleanExtractedText(data.text);
      
      console.log(`PDF extraction successful: ${cleanText.length} characters from ${data.numpages} pages`);
      
      return {
        text: cleanText,
        pageCount: data.numpages || 1,
        extractionMethod: 'pdf-parse',
        success: cleanText.length > 50, // Require substantial content
        metadata: {
          title: data.info?.Title,
          author: data.info?.Author,
          subject: data.info?.Subject,
          creator: data.info?.Creator,
          producer: data.info?.Producer,
          creationDate: data.info?.CreationDate,
          modificationDate: data.info?.ModDate
        }
      };
    } catch (error) {
      console.error(`PDF extraction failed for ${fileName}:`, error);
      
      // Fallback to OCR if PDF parsing fails
      console.log(`Attempting OCR fallback for ${fileName}`);
      return await this.extractFromPDFWithOCR(buffer, fileName);
    }
  }

  /**
   * Extract text from DOCX using mammoth
   */
  private static async extractFromDOCX(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
    try {
      console.log(`Extracting DOCX text from: ${fileName}`);
      
      const result = await mammoth.extractRawText({ buffer });
      const cleanText = this.cleanExtractedText(result.value);
      
      console.log(`DOCX extraction successful: ${cleanText.length} characters`);
      
      if (result.messages.length > 0) {
        console.log(`DOCX extraction warnings:`, result.messages);
      }
      
      return {
        text: cleanText,
        pageCount: Math.ceil(cleanText.length / 3000), // Estimate pages
        extractionMethod: 'mammoth',
        success: cleanText.length > 20,
      };
    } catch (error) {
      console.error(`DOCX extraction failed for ${fileName}:`, error);
              return {
          text: '',
          pageCount: 0,
          extractionMethod: 'mammoth',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
  }

  /**
   * Extract text from plain text files
   */
  private static async extractFromText(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
    try {
      const text = buffer.toString('utf8');
      const cleanText = this.cleanExtractedText(text);
      
      console.log(`Text extraction successful: ${cleanText.length} characters`);
      
      return {
        text: cleanText,
        pageCount: Math.ceil(cleanText.length / 3000),
        extractionMethod: 'utf8',
        success: cleanText.length > 0,
      };
    } catch (error) {
      // Try different encodings
      try {
        const text = buffer.toString('latin1');
        const cleanText = this.cleanExtractedText(text);
        
        return {
          text: cleanText,
          pageCount: Math.ceil(cleanText.length / 3000),
          extractionMethod: 'latin1',
          success: cleanText.length > 0,
        };
      } catch (fallbackError) {
        console.error(`Text extraction failed for ${fileName}:`, error);
                  return {
            text: '',
            pageCount: 0,
            extractionMethod: 'text',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
      }
    }
  }

  /**
   * Extract text from images using OCR
   */
  private static async extractFromImage(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
    try {
      console.log(`Starting OCR for image: ${fileName}`);
      
      const { data: { text } } = await tesseract.recognize(buffer, 'eng', {
        logger: m => console.log(`OCR progress: ${m.status} ${m.progress || ''}`),
      });
      
      const cleanText = this.cleanExtractedText(text);
      
      console.log(`OCR extraction successful: ${cleanText.length} characters`);
      
      return {
        text: cleanText,
        pageCount: 1,
        extractionMethod: 'tesseract-ocr',
        success: cleanText.length > 20,
      };
    } catch (error) {
      console.error(`OCR extraction failed for ${fileName}:`, error);
              return {
          text: '',
          pageCount: 0,
          extractionMethod: 'tesseract-ocr',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
  }

  /**
   * Extract text from PDF using OCR as fallback
   */
  private static async extractFromPDFWithOCR(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
    try {
      console.log(`Using OCR fallback for PDF: ${fileName}`);
      
      // Convert PDF to image first (this requires pdf2pic which is already installed)
      const pdf2pic = require('pdf2pic');
      
      const convert = pdf2pic.fromBuffer(buffer, {
        density: 300,
        saveFilename: "page",
        savePath: "./temp_images/",
        format: "png",
        width: 2000,
        height: 2000
      });
      
      // Convert first page to image
      const pageImage = await convert(1, true);
      
      if (pageImage && pageImage.buffer) {
        const { data: { text } } = await tesseract.recognize(pageImage.buffer, 'eng');
        const cleanText = this.cleanExtractedText(text);
        
        console.log(`PDF OCR extraction successful: ${cleanText.length} characters`);
        
        return {
          text: cleanText,
          pageCount: 1,
          extractionMethod: 'pdf-to-image-ocr',
          success: cleanText.length > 20,
        };
      }
      
      throw new Error('Could not convert PDF to image');
      
    } catch (error) {
      console.error(`PDF OCR extraction failed for ${fileName}:`, error);
              return {
          text: '',
          pageCount: 0,
          extractionMethod: 'pdf-to-image-ocr',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
  }

  /**
   * Clean and normalize extracted text
   */
  private static cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove control characters but keep line breaks
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove multiple consecutive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim();
  }

  /**
   * Validate text quality
   */
  static validateTextQuality(text: string): boolean {
    if (!text || text.length < 50) {
      return false;
    }
    
    // Check for reasonable word structure
    const words = text.split(/\s+/).filter(word => word.length > 1);
    const wordCount = words.length;
    
    if (wordCount < 10) {
      return false;
    }
    
    // Check for alphabet characters (not just symbols/numbers)
    const hasLetters = /[a-zA-Z]/.test(text);
    if (!hasLetters) {
      return false;
    }
    
    // Check for excessive corruption patterns
    const corruptionRatio = (text.match(/[^\w\s.,!?;:()\-$%/@\n]/g) || []).length / text.length;
    if (corruptionRatio > 0.3) {
      return false;
    }
    
    return true;
  }
}