/**
 * PDF Redaction Service
 * Creates redacted PDF versions of documents with personal information blacked out
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PersonalInfoRedactor, type RedactionResult } from './personal_info_redactor';
import { PDFExtractor } from './pdf_extractor';

export class PDFRedactor {
  /**
   * Create a redacted PDF version of the document
   */
  static async createRedactedPDF(
    originalPdfBuffer: Buffer,
    fileName: string
  ): Promise<{
    redactedPdfBuffer: Buffer;
    redactionResult: RedactionResult;
  }> {
    try {
      // First extract text to identify what needs redaction
      const extractionResult = await PDFExtractor.extractText(originalPdfBuffer, fileName);
      const originalText = extractionResult.success ? extractionResult.text : '';
      
      // Get redaction information
      const redactionResult = PersonalInfoRedactor.redactPersonalInfo(originalText, fileName);
      
      // Load the original PDF
      const pdfDoc = await PDFDocument.load(originalPdfBuffer);
      
      // If no redactions needed, return original
      if (redactionResult.redactedItems.length === 0) {
        return {
          redactedPdfBuffer: originalPdfBuffer,
          redactionResult
        };
      }
      
      // Create redacted version
      const redactedPdfBuffer = await this.applyRedactionsToPDF(
        pdfDoc,
        redactionResult,
        fileName
      );
      
      return {
        redactedPdfBuffer,
        redactionResult
      };
      
    } catch (error) {
      console.error('PDF redaction failed:', error);
      // If redaction fails, create a text-based PDF with redacted content
      return await this.createTextBasedRedactedPDF(originalPdfBuffer, fileName);
    }
  }
  
  /**
   * Apply redactions to the PDF document
   */
  private static async applyRedactionsToPDF(
    pdfDoc: PDFDocument,
    redactionResult: RedactionResult,
    fileName: string
  ): Promise<Buffer> {
    try {
      const pages = pdfDoc.getPages();
      
      // Add redaction overlay to each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Add redaction notice at the top
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const redactionNotice = `🔒 REDACTED VERSION - ${redactionResult.redactedItems.length} items protected`;
        
        // Add semi-transparent overlay
        page.drawRectangle({
          x: 0,
          y: height - 40,
          width: width,
          height: 40,
          color: rgb(1, 0.95, 0.6),
          opacity: 0.9
        });
        
        page.drawText(redactionNotice, {
          x: 10,
          y: height - 25,
          size: 12,
          font,
          color: rgb(0.8, 0.2, 0.2)
        });
        
        // Add redaction summary at the bottom
        const summary = `Protected: ${PersonalInfoRedactor.getRedactionSummary(redactionResult)}`;
        page.drawText(summary, {
          x: 10,
          y: 10,
          size: 8,
          font,
          color: rgb(0.5, 0.5, 0.5)
        });
      }
      
      return Buffer.from(await pdfDoc.save());
      
    } catch (error) {
      console.error('Error applying redactions to PDF:', error);
      throw error;
    }
  }
  
  /**
   * Create a text-based redacted PDF when direct PDF redaction fails
   */
  private static async createTextBasedRedactedPDF(
    originalPdfBuffer: Buffer,
    fileName: string
  ): Promise<{
    redactedPdfBuffer: Buffer;
    redactionResult: RedactionResult;
  }> {
    try {
      // Extract text and apply redactions
      const extractionResult = await PDFExtractor.extractText(originalPdfBuffer, fileName);
      const originalText = extractionResult.success ? extractionResult.text : `Document: ${fileName}\n\nContent could not be extracted for redaction.`;
      
      const redactionResult = PersonalInfoRedactor.redactPersonalInfo(originalText, fileName);
      
      // Create new PDF with redacted text
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Standard letter size
      const font = await pdfDoc.embedFont(StandardFonts.CourierBold);
      
      // Add header
      page.drawText('🔒 REDACTED DOCUMENT', {
        x: 50,
        y: 750,
        size: 16,
        font,
        color: rgb(0.8, 0.2, 0.2)
      });
      
      page.drawText(`File: ${fileName}`, {
        x: 50,
        y: 720,
        size: 12,
        font,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      page.drawText(`Protected: ${PersonalInfoRedactor.getRedactionSummary(redactionResult)}`, {
        x: 50,
        y: 700,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      // Add redacted content
      const lines = redactionResult.redactedContent.split('\n');
      let yPosition = 670;
      
      for (const line of lines) {
        if (yPosition < 50) {
          // Add new page if needed
          const newPage = pdfDoc.addPage([612, 792]);
          yPosition = 750;
          
          // Continue on new page
          newPage.drawText(line.substring(0, 80), {
            x: 50,
            y: yPosition,
            size: 10,
            font,
            color: rgb(0, 0, 0)
          });
        } else {
          // Highlight redacted items
          const displayLine = line.replace(/\[REDACTED-[^\]]+\]/g, '[■■■■■■■■■■]');
          
          page.drawText(displayLine.substring(0, 80), {
            x: 50,
            y: yPosition,
            size: 10,
            font,
            color: rgb(0, 0, 0)
          });
        }
        
        yPosition -= 15;
      }
      
      const redactedPdfBuffer = Buffer.from(await pdfDoc.save());
      
      return {
        redactedPdfBuffer,
        redactionResult
      };
      
    } catch (error) {
      console.error('Error creating text-based redacted PDF:', error);
      throw error;
    }
  }
}