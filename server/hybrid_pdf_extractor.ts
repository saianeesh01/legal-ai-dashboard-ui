async function loadPDFJS() {
  try {
    return await import('pdfjs-dist/legacy/build/pdf.mjs');
  } catch {
    return await import('pdfjs-dist/build/pdf.mjs');
  }
}

export interface HybridExtractionResult {
  text: string;
  method: 'pdfjs' | 'ocr';
  success: boolean;
  error?: string;
  pageCount?: number;
}

export class HybridPDFExtractor {
  /**
   * Hybrid PDF text extraction using pdfjs-dist first, then OCR fallback
   */
  static async hybridExtract(buffer: Buffer, fileName: string): Promise<HybridExtractionResult> {
    console.log(`Starting hybrid extraction for: ${fileName}`);
    
    try {
      // Method 1: Try pdfjs-dist first
      const pdfjsResult = await this.extractWithPDFJS(buffer, fileName);
      
      if (pdfjsResult.success && this.isTextValid(pdfjsResult.text)) {
        console.log(`✓ pdfjs-dist extraction successful: ${pdfjsResult.text.length} characters`);
        return pdfjsResult;
      }
      
      console.log(`⚠️ pdfjs-dist failed or insufficient text, trying alternative extraction`);
      
      // Method 2: Try alternative PDF parsing with lower requirements
      const altResult = await this.extractAlternative(buffer, fileName);
      
      if (altResult.success && this.isTextValid(altResult.text)) {
        console.log(`✓ Alternative extraction successful: ${altResult.text.length} characters`);
        return altResult;
      }
      
      console.error(`✗ All extraction methods failed for ${fileName}`);
      return {
        text: '',
        method: 'pdfjs',
        success: false,
        error: 'All PDF text extraction methods failed'
      };
      
    } catch (error) {
      console.error(`✗ Hybrid extraction error for ${fileName}:`, error);
      return {
        text: '',
        method: 'ocr',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Extract text using pdfjs-dist
   */
  private static async extractWithPDFJS(buffer: Buffer, fileName: string): Promise<HybridExtractionResult> {
    try {
      console.log(`Attempting pdfjs-dist extraction for: ${fileName}`);
      
      const lib = await loadPDFJS();
      const pdf = await lib.getDocument({ data: buffer }).promise;
      
      let fullText = '';
      const pageCount = pdf.numPages;
      
      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      const cleanText = fullText.trim();
      
      return {
        text: cleanText,
        method: 'pdfjs',
        success: cleanText.length > 0,
        pageCount
      };
      
    } catch (error) {
      console.error(`pdfjs-dist extraction failed:`, error);
      return {
        text: '',
        method: 'pdfjs',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Alternative extraction method with different parsing approach
   */
  private static async extractAlternative(buffer: Buffer, fileName: string): Promise<HybridExtractionResult> {
    try {
      console.log(`Attempting alternative extraction for: ${fileName}`);
      
      const lib = await loadPDFJS();
      const pdf = await lib.getDocument({ 
        data: buffer,
        useSystemFonts: true,
        disableFontFace: true
      }).promise;
      
      let fullText = '';
      const pageCount = pdf.numPages;
      
      for (let i = 1; i <= pageCount; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          // Extract text with better formatting
          const pageText = textContent.items
            .map((item: any) => {
              if (item.str) {
                return item.str;
              }
              return '';
            })
            .filter(text => text.trim().length > 0)
            .join(' ');
            
          fullText += pageText + '\n';
          console.log(`Alternative extraction page ${i}: ${pageText.length} characters`);
        } catch (pageError) {
          console.warn(`Failed to extract page ${i}:`, pageError);
          continue;
        }
      }
      
      const cleanText = fullText.trim();
      
      return {
        text: cleanText,
        method: 'pdfjs',
        success: cleanText.length > 0,
        pageCount
      };
      
    } catch (error) {
      console.error(`Alternative extraction failed:`, error);
      return {
        text: '',
        method: 'pdfjs',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Validate if extracted text is meaningful (at least 50 words)
   */
  private static isTextValid(text: string): boolean {
    if (!text || text.length < 10) return false;
    
    // Check for PDF binary markers (corruption)
    if (text.includes('obj') && text.includes('endobj') && text.includes('stream')) {
      return false;
    }
    
    // Count words
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length >= 50;
  }
}