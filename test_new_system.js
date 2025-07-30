/**
 * Test script for the new PDF extraction and AI summarization system
 */

import { PDFExtractor } from './server/pdf_extractor.js';
import { PDFRedactor } from './server/pdf_redactor.js';
import * as fs from 'fs';

async function testPDFExtraction() {
  console.log('=== Testing New PDF Extraction System ===');
  
  try {
    // Test with a small PDF if available
    const testFiles = [
      './528267_JAPAN-2023-HUMAN-RIGHTS-REPORT.pdf',
      './test_document.txt'
    ];
    
    for (const testFile of testFiles) {
      if (fs.existsSync(testFile)) {
        console.log(`\nTesting file: ${testFile}`);
        
        const buffer = fs.readFileSync(testFile);
        const result = await PDFExtractor.extractText(buffer, testFile);
        
        console.log(`✓ Extraction Method: ${result.extractionMethod}`);
        console.log(`✓ Success: ${result.success}`);
        console.log(`✓ Quality: ${result.quality}`);
        console.log(`✓ Word Count: ${result.wordCount}`);
        console.log(`✓ Has Valid Content: ${result.hasValidContent}`);
        console.log(`✓ Page Count: ${result.pageCount}`);
        
        if (result.text && result.text.length > 0) {
          console.log(`✓ Sample Text: ${result.text.substring(0, 200)}...`);
          
          // Test text validation
          const validation = PDFRedactor.validateTextForAI(result.text);
          console.log(`✓ AI Validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
          if (!validation.isValid) {
            console.log(`  Reason: ${validation.reason}`);
          }
          
          // Test text preparation
          const prep = PDFRedactor.prepareTextForAI(result.text, 1000);
          console.log(`✓ AI Preparation: ${prep.isValid ? 'PASSED' : 'FAILED'}`);
          console.log(`✓ Chunks: ${prep.chunks.length}`);
          
        } else {
          console.log('✗ No text extracted');
        }
        
        break; // Test only the first available file
      }
    }
    
    console.log('\n✓ PDF Extraction System Test Complete');
    
  } catch (error) {
    console.error('✗ PDF Extraction Test Failed:', error.message);
  }
}

async function testRedactionSystem() {
  console.log('\n=== Testing New Redaction System ===');
  
  try {
    // Test text-only redaction
    const sampleText = `
      John Doe's A-number is A12345678 and his SSN is 123-45-6789.
      Contact him at john.doe@example.com or call 555-123-4567.
      He lives at 123 Main Street, Anytown, USA 12345.
      Credit card: 4532-1234-5678-9012
    `;
    
    const redactionResult = PDFRedactor.redactText(sampleText);
    
    console.log(`✓ Redaction Success: ${redactionResult.success}`);
    console.log(`✓ Patterns Found: ${redactionResult.patternsFound.join(', ')}`);
    console.log(`✓ Items Redacted: ${redactionResult.itemsRedacted}`);
    console.log(`✓ Method: ${redactionResult.method}`);
    
    if (redactionResult.redactedText) {
      console.log(`✓ Redacted Text: ${redactionResult.redactedText.substring(0, 200)}...`);
    }
    
    console.log('\n✓ Redaction System Test Complete');
    
  } catch (error) {
    console.error('✗ Redaction Test Failed:', error.message);
  }
}

async function main() {
  console.log('Legal AI Dashboard - System Integration Test');
  console.log('============================================');
  
  await testPDFExtraction();
  await testRedactionSystem();
  
  console.log('\n🎉 All tests completed!');
  console.log('\nNext steps:');
  console.log('1. Test AI service: curl http://localhost:5001/health');
  console.log('2. Test summarization: curl -X POST http://localhost:5000/api/documents/JOB_ID/summarize');
  console.log('3. Deploy with Docker: docker-compose up --build');
}

main().catch(console.error);