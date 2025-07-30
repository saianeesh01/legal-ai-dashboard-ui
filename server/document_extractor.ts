/**
 * Comprehensive Document Text Extraction System
 * Supports PDF, DOCX, and other document formats with proper content extraction
 */

import * as mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { join } from 'path';
// ✅ Node.js compatible import
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import 'pdfjs-dist/legacy/build/pdf.worker.js';

import { DOMMatrix } from 'canvas';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// (global as any).DOMMatrix = DOMMatrix; // Polyfill for Node.js
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
   * Extract text from PDF
   */
  private static async extractFromPDF(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
    console.log(`Extracting PDF text from: ${fileName}`);
    
    // Method 1: PDF.js
    try {
      const pdfjsResult = await this.extractWithPDFJS(buffer, fileName);
      if (pdfjsResult.success && pdfjsResult.text.length > 100) {
        console.log(`PDF.js extraction successful: ${pdfjsResult.text.length} characters`);
        return pdfjsResult;
      }
    } catch (error) {
      console.error(`PDF.js extraction failed:`, error);
    }

    // Method 2: Enhanced buffer parsing
    try {
      const bufferResult = await this.extractFromPDFBuffer(buffer, fileName);
      if (bufferResult.success && bufferResult.text.length > 50) {
        console.log(`Enhanced buffer extraction successful: ${bufferResult.text.length} characters`);
        return bufferResult;
      }
    } catch (error) {
      console.error(`Buffer extraction failed:`, error);
    }

    // Method 3: Skip direct OCR on PDF to avoid crashes
    console.warn(`⚠️ OCR skipped for PDFs to avoid unsupported raw PDF input to Tesseract.`);
    
    return {
      text: '',
      pageCount: 0,
      extractionMethod: 'all-methods-failed',
      success: false,
      error: 'No reliable PDF extraction method succeeded'
    };
  }

  /**
 * Extract text using PDF.js (most reliable method)
 */
 /*
private static async extractWithPDFJS(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
  try {
    console.log(`Using PDF.js extraction for: ${fileName}`);
    
    // Import PDF.js dynamically
    const pdfjsLib = await import('pdfjs-dist');

    // Set up PDF.js worker - use CDN version for Node.js compatibility
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js';

    // ✅ Convert Buffer → Uint8Array
    const uint8ArrayData = new Uint8Array(buffer);

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: uint8ArrayData });
    const pdf = await loadingTask.promise;

    console.log(`PDF loaded successfully: ${pdf.numPages} pages`);
    
    let extractedText = '';
    const pageCount = pdf.numPages;

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      extractedText += pageText + '\n';
      console.log(`Extracted ${pageText.length} characters from page ${pageNum}`);
    }

    const cleanText = this.cleanExtractedText(extractedText);

    return {
      text: cleanText,
      pageCount: pageCount,
      extractionMethod: 'pdfjs',
      success: cleanText.length > 0,
      metadata: {}
    };

  } catch (error) {
    console.error(`PDF.js extraction failed for ${fileName}:`, error);
    throw error;
  }
}

*/
  /**
   * Extract text using PDF.js
   */

  
  private static async extractWithPDFJS(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
    try {
        console.log(`Using PDF.js extraction for: ${fileName}`);

        // ✅ Set workerSrc correctly for Node.js - check if GlobalWorkerOptions exists
        try {
          const workerPath = join(process.cwd(), 'node_modules/pdfjs-dist/build/pdf.worker.js');
          if ((pdfjsLib as any).GlobalWorkerOptions) {
            (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerPath;
          }
        } catch (workerError) {
          console.warn('Could not set PDF.js worker, proceeding without:', workerError.message);
        }

        // Convert Buffer → Uint8Array
        const uint8ArrayData = new Uint8Array(buffer);

        // Load PDF
        const loadingTask = pdfjsLib.getDocument({ data: uint8ArrayData });
        const pdf = await loadingTask.promise;

        console.log(`PDF loaded successfully: ${pdf.numPages} pages`);

        let extractedText = '';
        const pageCount = pdf.numPages;

        // Extract text from each page
        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            extractedText += pageText + '\n';
            console.log(`Extracted ${pageText.length} characters from page ${pageNum}`);
        }

        const cleanText = this.cleanExtractedText(extractedText);

        return {
            text: cleanText,
            pageCount: pageCount,
            extractionMethod: 'pdfjs',
            success: cleanText.length > 0,
            metadata: {}
        };

    } catch (error) {
        console.error(`PDF.js extraction failed:`, error);
        throw error;
    }
}


  /**
   * Enhanced buffer-based PDF extraction
   */
  private static async extractFromPDFBuffer(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
    try {
      console.log(`Using enhanced buffer-based PDF extraction for: ${fileName}`);
      const bufferString = buffer.toString('binary');
      const documentType = this.detectDocumentTypeFromBuffer(bufferString, fileName);
      console.log(`Detected document type: ${documentType}`);

      const textPatterns = [
        /[\x20-\x7E]{30,}/g,
        /[A-Z][A-Za-z\s\d]{20,}[.!?]/g,
        /[A-Z][A-Z\s]+(?:REPORT|DOCUMENT|FORM|APPLICATION)/g,
        /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:202[0-9]|20[0-9][0-9])/g,
        /(?:NOTICE|COURT|HEARING|CHARGE|ALLEGATION|IMMIGRATION|ASYLUM)[A-Za-z\s]*/g
      ];
      
      let extractedText = '';
      for (const pattern of textPatterns) {
        const matches = bufferString.match(pattern) || [];
        const filteredMatches = matches.filter(text => text.length > 20).map(text => text.trim()).slice(0, 100);
        if (filteredMatches.length > 0) extractedText += filteredMatches.join(' ') + ' ';
      }
      
      const cleanText = this.cleanExtractedText(extractedText);

      if (cleanText.length < 1000 || cleanText.startsWith('<</Linearized')) {
        console.warn(`⚠️ Low-quality buffer extraction for ${fileName}.`);
      }

      return {
        text: cleanText,
        pageCount: 1,
        extractionMethod: 'enhanced-buffer-fallback',
        success: cleanText.length > 50,
      };

    } catch (error) {
      console.error(`Buffer extraction failed:`, error);
      return { text: '', pageCount: 0, extractionMethod: 'buffer-fallback', success: false };
    }
  }

  /**
   * Extract text from DOCX
   */
  private static async extractFromDOCX(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
    try {
      console.log(`Extracting DOCX text from: ${fileName}`);
      const result = await mammoth.extractRawText({ buffer });
      const cleanText = this.cleanExtractedText(result.value);
      return { text: cleanText, pageCount: 1, extractionMethod: 'mammoth', success: true };
    } catch (error) {
      console.error(`DOCX extraction failed:`, error);
      return { text: '', pageCount: 0, extractionMethod: 'mammoth', success: false };
    }
  }

  /**
   * Extract text from plain text
   */
  private static async extractFromText(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
    try {
      const text = buffer.toString('utf8');
      const cleanText = this.cleanExtractedText(text);
      return { text: cleanText, pageCount: 1, extractionMethod: 'utf8', success: true };
    } catch (error) {
      console.error(`Text extraction failed:`, error);
      return { text: '', pageCount: 0, extractionMethod: 'utf8', success: false };
    }
  }

  /**
   * Extract text from images using OCR
   */
  private static async extractFromImage(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
    try {
      console.log(`Extracting text from image: ${fileName}`);
      const result = await Tesseract.recognize(buffer, 'eng');
      const cleanText = this.cleanExtractedText(result.data.text);
      return { text: cleanText, pageCount: 1, extractionMethod: 'tesseract-ocr', success: true };
    } catch (error) {
      console.error(`Image OCR extraction failed:`, error);
      return { text: '', pageCount: 0, extractionMethod: 'tesseract-ocr', success: false };
    }
  }

  /**
   * Clean extracted text
   */
  private static cleanExtractedText(text: string): string {
    if (!text) return '';
    return text.replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .replace(/\t+/g, ' ')
      .replace(/[^\x09\x0A\x0D\x20-\uFFFF]/g, '')
      .trim();
  }

  private static detectDocumentTypeFromBuffer(bufferString: string, fileName: string): string {
    const lowerBuffer = bufferString.toLowerCase();
    const lowerFileName = fileName.toLowerCase();

    if (lowerFileName.includes('country') || lowerFileName.includes('human rights') || 
        lowerBuffer.includes('country conditions') || lowerBuffer.includes('human rights report')) {
      return 'country_report';
    }
    if (lowerFileName.includes('nta') || lowerFileName.includes('notice to appear') ||
        lowerBuffer.includes('notice to appear') || lowerBuffer.includes('form i-862')) {
      return 'nta';
    }
    if (lowerFileName.includes('i-589') || lowerBuffer.includes('form i-589') ||
        lowerBuffer.includes('asylum application')) {
      return 'application_i589';
    }
    if (lowerFileName.includes('proposal') || lowerFileName.includes('grant') ||
        lowerBuffer.includes('proposal') || lowerBuffer.includes('grant application')) {
      return 'proposal';
    }
    return 'unknown';
  }

  /**
 * Validate text quality
 */
static validateTextQuality(text: string): boolean {
    if (!text || text.length < 200) {
        // Reject very short text, likely failed extraction
        return false;
    }

    // Count alphabetic characters
    const alphaCount = (text.match(/[a-zA-Z]/g) || []).length;
    const totalChars = text.length;
    const alphaRatio = totalChars > 0 ? alphaCount / totalChars : 0;

    // Reject text with too few readable characters
    if (alphaRatio < 0.3) {
        return false;
    }

    // Reject known garbage patterns from buffer extraction
    if (/^<</.test(text.trim()) || text.includes("obj") && text.includes("endobj")) {
        return false;
    }

    return true;
}


}
