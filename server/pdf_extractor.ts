 // import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist;

 /** 
  import * as pdfjsLib from 'pdfjs-dist';


 //GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js';

 pdfjsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.js');


interface PDFExtractionResult {
  text: string;
  pageCount: number;
  extractionMethod: string;
  success: boolean;
  error?: string;
}

export class PDFExtractor {
  /**
   * Extract text using pdfjs-dist (primary method)
   
  static async extractText(buffer: Buffer, fileName: string): Promise<PDFExtractionResult> {
    try {
      const pdf = await getDocument({ data: buffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      return {
        text: fullText.trim(),
        pageCount: pdf.numPages,
        extractionMethod: 'pdfjs-dist',
        success: true
      };
    } catch (error) {
      console.error('pdfjs-dist extraction failed:', error);
      return await this.fallbackTextExtraction(buffer);
    }
  }

  /**
   * Fallback extraction with internal tag check
   
  private static async fallbackTextExtraction(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      const text = buffer.toString('utf8');

      if (/<</.test(text) && /\/(Linearized|XRef|Filter|stream)/.test(text)) {
        return {
          text: '',
          pageCount: 0,
          extractionMethod: 'fallback-buffer',
          success: false,
          error: 'PDF internals detected instead of text'
        };
      }

      const readableText = text.match(/[\x20-\x7E]+/g);
      const cleanSegments = (readableText || [])
        .filter(segment => segment.length > 5 && /[a-zA-Z]/.test(segment))
        .map(segment => segment.trim());

      const extractedText = cleanSegments.join(' ').replace(/\s+/g, ' ').trim();

      return {
        text: extractedText,
        pageCount: 1,
        extractionMethod: 'fallback-buffer',
        success: extractedText.length > 0
      };
    } catch (err) {
      return {
        text: '',
        pageCount: 0,
        extractionMethod: 'fallback-buffer',
        success: false,
        error: 'Fallback extraction failed'
      };
    }
  }
}
**/


import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Set workerSrc properly for Node.js ESM
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(
  __dirname,
  '../node_modules/pdfjs-dist/build/pdf.worker.js'
);

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
        let extractedText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            extractedText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }

        return extractedText.trim();
    } catch (error) {
        console.error("PDF extraction failed:", error);
        return '';
    }
}
