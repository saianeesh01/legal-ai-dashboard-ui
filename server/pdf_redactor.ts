/**
 * PDF Redaction Service
 * Creates redacted PDF versions of documents with personal information blacked out
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PersonalInfoRedactor, type RedactionResult } from './personal_info_redactor';
import { extractTextFromPDF } from './pdf_extractor';

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
      // ✅ Extract text safely
      const extractionResult = await extractTextFromPDF(originalPdfBuffer, fileName);
      const originalText = extractionResult && extractionResult.success
        ? extractionResult.text
        : `Document: ${fileName}\n\n(Content could not be fully extracted)`;

      // Get redaction information
      const redactionResult = PersonalInfoRedactor.redactPersonalInfo(originalText, fileName);

      // Load the original PDF
      const pdfDoc = await PDFDocument.load(originalPdfBuffer);

      // For legal forms, always apply redaction even if no personal info detected
      const shouldForceRedaction = fileName.toLowerCase().includes('form') ||
                                   fileName.toLowerCase().includes('i-862') ||
                                   fileName.toLowerCase().includes('notice') ||
                                   fileName.toLowerCase().includes('application');

      // If no redactions needed and it's not a form that should be redacted, return original
      if (redactionResult.redactedItems.length === 0 && !shouldForceRedaction) {
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
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const redactionNotice = `[REDACTED VERSION] - Personal information protected`;

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

        // Apply comprehensive redaction approach
        const shouldApplyRedaction = redactionResult.redactedItems.length > 0 ||
                                   fileName.toLowerCase().includes('form') ||
                                   fileName.toLowerCase().includes('i-862') ||
                                   fileName.toLowerCase().includes('notice') ||
                                   fileName.toLowerCase().includes('application');

        if (shouldApplyRedaction) {
          if (fileName.toLowerCase().includes('i-862') || fileName.toLowerCase().includes('notice')) {
            await this.applyNoticeToAppearRedactions(page, width, height, redactionResult);
          } else {
            await this.applyGeneralFormRedactions(page, width, height, redactionResult);
          }
        }

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
      const extractionResult = await extractTextFromPDF(originalPdfBuffer, fileName);
      const originalText = extractionResult && extractionResult.success
        ? extractionResult.text
        : `Document: ${fileName}\n\nContent could not be extracted for redaction.`;

      const redactionResult = PersonalInfoRedactor.redactPersonalInfo(originalText, fileName);

      // Create new PDF with redacted text
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Standard letter size
      const font = await pdfDoc.embedFont(StandardFonts.CourierBold);

      // Add header
      page.drawText('[REDACTED DOCUMENT]', {
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
          const newPage = pdfDoc.addPage([612, 792]);
          yPosition = 750;
          newPage.drawText(line.substring(0, 80), {
            x: 50,
            y: yPosition,
            size: 10,
            font,
            color: rgb(0, 0, 0)
          });
        } else {
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

  /**
   * Apply redactions specific to Notice to Appear (I-862) forms
   */
  private static async applyNoticeToAppearRedactions(page: any, width: number, height: number, redactionResult: RedactionResult) {
    const ntaRedactionAreas = [
      { x: 490, y: height - 65, width: 100, height: 12 },
      { x: 280, y: height - 100, width: 150, height: 12 },
      { x: 430, y: height - 100, width: 100, height: 12 },
      { x: 80, y: height - 120, width: 450, height: 12 },
      { x: 450, y: height - 120, width: 120, height: 12 },
      { x: 150, y: height - 140, width: 250, height: 12 },
      { x: 150, y: height - 155, width: 250, height: 12 },
      { x: 150, y: height - 290, width: 200, height: 12 },
      { x: 150, y: height - 305, width: 200, height: 12 },
      { x: 150, y: height - 340, width: 300, height: 12 },
      { x: 80, y: height - 520, width: 450, height: 12 },
      { x: 80, y: height - 545, width: 200, height: 12 },
      { x: 300, y: height - 580, width: 200, height: 12 },
      { x: 80, y: height - 610, width: 150, height: 12 },
      { x: 350, y: height - 610, width: 200, height: 12 },
    ];

    for (const area of ntaRedactionAreas) {
      if (area.y > 50 && area.y < height - 50) {
        page.drawRectangle({
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height,
          color: rgb(0, 0, 0),
          opacity: 1
        });
      }
    }
  }

  /**
   * Apply general form redactions for other document types
   */
  private static async applyGeneralFormRedactions(page: any, width: number, height: number, redactionResult: RedactionResult) {
    const generalRedactionAreas = [
      { x: 100, y: height - 120, width: 200, height: 12 },
      { x: 100, y: height - 140, width: 200, height: 12 },
      { x: 100, y: height - 200, width: 300, height: 12 },
      { x: 100, y: height - 215, width: 300, height: 12 },
      { x: 100, y: height - 230, width: 200, height: 12 },
      { x: 100, y: height - 280, width: 150, height: 12 },
      { x: 300, y: height - 280, width: 150, height: 12 },
      { x: 100, y: height - 320, width: 120, height: 12 },
    ];

    for (const area of generalRedactionAreas) {
      page.drawRectangle({
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
        color: rgb(0, 0, 0),
        opacity: 1
      });
    }
  }
}
