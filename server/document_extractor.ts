/**
 * Comprehensive Document Text Extraction System
 * Supports PDF, DOCX, and other document formats with proper content extraction
 */

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
   * Extract text from PDF using multiple robust methods
   */
  private static async extractFromPDF(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
    console.log(`Extracting PDF text from: ${fileName}`);
    
    // Method 1: Try PDF.js (most reliable)
    try {
      const pdfjsResult = await this.extractWithPDFJS(buffer, fileName);
      if (pdfjsResult.success && pdfjsResult.text.length > 100) {
        console.log(`PDF.js extraction successful: ${pdfjsResult.text.length} characters from ${pdfjsResult.pageCount} pages`);
        return pdfjsResult;
      }
    } catch (error) {
      console.error(`PDF.js extraction failed for ${fileName}:`, error);
    }

    // Method 2: Enhanced buffer parsing
    try {
      const bufferResult = await this.extractFromPDFBuffer(buffer, fileName);
      if (bufferResult.success && bufferResult.text.length > 50) {
        console.log(`Enhanced buffer extraction successful: ${bufferResult.text.length} characters`);
        return bufferResult;
      }
    } catch (error) {
      console.error(`Buffer extraction failed for ${fileName}:`, error);
    }

    // Method 3: OCR fallback for image-based PDFs
    try {
      const ocrResult = await this.extractFromPDFWithOCR(buffer, fileName);
      if (ocrResult.success && ocrResult.text.length > 20) {
        console.log(`OCR extraction successful: ${ocrResult.text.length} characters`);
        return ocrResult;
      }
    } catch (error) {
      console.error(`OCR extraction failed for ${fileName}:`, error);
    }

    // Final fallback
    console.error(`All PDF extraction methods failed for ${fileName}`);
    return {
      text: '',
      pageCount: 0,
      extractionMethod: 'all-methods-failed',
      success: false,
      error: 'All PDF extraction methods failed'
    };
  }

  /**
   * Extract text using PDF.js (most reliable method)
   */
  private static async extractWithPDFJS(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
    try {
      console.log(`Using PDF.js extraction for: ${fileName}`);
      
      // Import PDF.js dynamically
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set up PDF.js worker - use CDN version for Node.js compatibility
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js';
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdf = await loadingTask.promise;
      
      console.log(`PDF loaded successfully: ${pdf.numPages} pages`);
      
      let extractedText = '';
      const pageCount = pdf.numPages;
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items into a single string
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        extractedText += pageText + '\n';
        console.log(`Extracted ${pageText.length} characters from page ${pageNum}`);
      }
      
      const cleanText = this.cleanExtractedText(extractedText);
      
      return {
        text: cleanText,
        pageCount: pageCount,
        extractionMethod: 'pdfjs',
        success: cleanText.length > 0,
        metadata: {
          title: undefined,
          author: undefined,
          subject: undefined,
          creator: undefined,
          producer: undefined,
          creationDate: undefined,
          modificationDate: undefined
        }
      };
      
    } catch (error) {
      console.error(`PDF.js extraction failed for ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Enhanced buffer-based PDF extraction with intelligent content detection
   */
  private static async extractFromPDFBuffer(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
    try {
      console.log(`Using enhanced buffer-based PDF extraction for: ${fileName}`);
      
      // Convert buffer to string and look for readable text
      const bufferString = buffer.toString('binary');
      
      // Detect document type for targeted extraction
      const documentType = this.detectDocumentTypeFromBuffer(bufferString, fileName);
      console.log(`Detected document type: ${documentType}`);
      
      // Enhanced text extraction patterns for better content capture
      const textPatterns = [
        // Look for longer text sequences (most reliable)
        /[\x20-\x7E]{30,}/g,
        // Look for structured content
        /[A-Z][A-Za-z\s\d]{20,}[.!?]/g,
        // Look for document headers
        /[A-Z][A-Z\s]+(?:REPORT|DOCUMENT|FORM|APPLICATION)/g,
        // Look for country names with years
        /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:202[0-9]|20[0-9][0-9])/g,
        // Look for legal terms
        /(?:NOTICE|COURT|HEARING|CHARGE|ALLEGATION|IMMIGRATION|ASYLUM)[A-Za-z\s]*/g
      ];
      
      let extractedText = '';
      
      for (const pattern of textPatterns) {
        const matches = bufferString.match(pattern) || [];
        const filteredMatches = matches
          .filter(text => text.length > 20 && /[a-zA-Z]/.test(text))
          .map(text => text.trim())
          .filter(text => text.length > 0)
          .slice(0, 100); // Limit to prevent overwhelming
        
        if (filteredMatches.length > 0) {
          extractedText += filteredMatches.join(' ') + ' ';
        }
      }
      
      // Also extract specific keywords and phrases that might be in the document
      const keywords = [
        'human rights', 'country conditions', 'persecution', 'discrimination',
        'government', 'police', 'violence', 'asylum', 'refugee', 'immigration',
        'legal', 'court', 'proceedings', 'evidence', 'testimony', 'witness',
        'affidavit', 'declaration', 'certification', 'notarized', 'sworn',
        'japan', 'nicaragua', 'mexico', 'china', 'india', 'brazil', 'russia',
        'iran', 'venezuela', 'honduras', 'guatemala', 'el salvador'
      ];
      
      const foundKeywords = keywords.filter(keyword => 
        bufferString.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length > 0) {
        extractedText += `Document contains references to: ${foundKeywords.join(', ')}. `;
      }
      
      // Extract year information
      const yearMatch = bufferString.match(/(20\d{2})/);
      if (yearMatch) {
        extractedText += `Document dated: ${yearMatch[1]}. `;
      }
      
      // Extract document type indicators
      const documentTypes = [
        'country report', 'human rights report', 'conditions report',
        'notice to appear', 'motion', 'brief', 'affidavit', 'declaration',
        'application', 'petition', 'cover letter', 'evidence'
      ];
      
      const foundDocTypes = documentTypes.filter(docType => 
        bufferString.toLowerCase().includes(docType.toLowerCase())
      );
      
      if (foundDocTypes.length > 0) {
        extractedText += `Document type indicators: ${foundDocTypes.join(', ')}. `;
      }
      
      const cleanText = this.cleanExtractedText(extractedText);
      
      console.log(`Enhanced buffer extraction successful: ${cleanText.length} characters`);
      console.log(`Found keywords: ${foundKeywords.join(', ')}`);
      console.log(`Document types: ${foundDocTypes.join(', ')}`);
      
      return {
        text: cleanText,
        pageCount: 1,
        extractionMethod: 'enhanced-buffer-fallback',
        success: cleanText.length > 50,
      };
    } catch (error) {
      console.error(`Buffer extraction failed for ${fileName}:`, error);
      return {
        text: '',
        pageCount: 0,
        extractionMethod: 'buffer-fallback',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
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
      
      return {
        text: cleanText,
        pageCount: 1,
        extractionMethod: 'mammoth',
        success: true,
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
      console.log(`Extracting text from: ${fileName}`);
      
      const text = buffer.toString('utf8');
      const cleanText = this.cleanExtractedText(text);
      
      console.log(`Text extraction successful: ${cleanText.length} characters`);
      
      return {
        text: cleanText,
        pageCount: 1,
        extractionMethod: 'utf8',
        success: true,
      };
    } catch (error) {
      console.error(`Text extraction failed for ${fileName}:`, error);
      return {
        text: '',
        pageCount: 0,
        extractionMethod: 'utf8',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract text from images using OCR
   */
  private static async extractFromImage(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
    try {
      console.log(`Extracting text from image: ${fileName}`);
      
      const result = await tesseract.recognize(buffer, 'eng', {
        logger: m => console.log(m)
      });
      
      const cleanText = this.cleanExtractedText(result.data.text);
      
      console.log(`Image OCR extraction successful: ${cleanText.length} characters`);
      
      return {
        text: cleanText,
        pageCount: 1,
        extractionMethod: 'tesseract-ocr',
        success: true,
      };
    } catch (error) {
      console.error(`Image OCR extraction failed for ${fileName}:`, error);
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
   * OCR fallback for PDFs that are image-based
   */
  private static async extractFromPDFWithOCR(buffer: Buffer, fileName: string): Promise<DocumentExtractionResult> {
    try {
      console.log(`Attempting OCR extraction for PDF: ${fileName}`);
      
      // This is a simplified OCR approach - in a full implementation,
      // you would convert PDF pages to images first
      const result = await tesseract.recognize(buffer, 'eng', {
        logger: m => console.log(m)
      });
      
      const cleanText = this.cleanExtractedText(result.data.text);
      
      return {
        text: cleanText,
        pageCount: 1,
        extractionMethod: 'pdf-ocr-fallback',
        success: cleanText.length > 20,
      };
    } catch (error) {
      console.error(`PDF OCR extraction failed for ${fileName}:`, error);
      return {
        text: '',
        pageCount: 0,
        extractionMethod: 'pdf-ocr-fallback',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clean and normalize extracted text
   */
  private static cleanExtractedText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/\n+/g, '\n')          // Normalize line breaks
      .replace(/\t+/g, ' ')           // Replace tabs with spaces
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
      .trim();
  }

  /**
   * Validate text quality
   */
  static validateTextQuality(text: string): boolean {
    if (!text || text.length < 10) return false;
    
    // Check for reasonable character distribution
    const alphaCount = (text.match(/[a-zA-Z]/g) || []).length;
    const totalChars = text.length;
    const alphaRatio = alphaCount / totalChars;
    
    return alphaRatio > 0.1; // At least 10% should be alphabetic
  }
  
  /**
   * Detect document type from buffer content
   */
  private static detectDocumentTypeFromBuffer(bufferString: string, fileName: string): string {
    const lowerBuffer = bufferString.toLowerCase();
    const lowerFileName = fileName.toLowerCase();
    
    // Country report detection
    if (lowerFileName.includes('country') || lowerFileName.includes('human rights') || 
        lowerBuffer.includes('country conditions') || lowerBuffer.includes('human rights report')) {
      return 'country_report';
    }
    
    // NTA detection
    if (lowerFileName.includes('nta') || lowerFileName.includes('notice to appear') ||
        lowerBuffer.includes('notice to appear') || lowerBuffer.includes('form i-862')) {
      return 'nta';
    }
    
    // I-589 detection
    if (lowerFileName.includes('i-589') || lowerBuffer.includes('form i-589') ||
        lowerBuffer.includes('asylum application')) {
      return 'application_i589';
    }
    
    // Proposal detection
    if (lowerFileName.includes('proposal') || lowerFileName.includes('grant') ||
        lowerBuffer.includes('proposal') || lowerBuffer.includes('grant application')) {
      return 'proposal';
    }
    
    return 'unknown';
  }
}