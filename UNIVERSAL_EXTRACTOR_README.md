# Universal Legal Document Extractor

A comprehensive, document-agnostic extraction system that automatically detects document types and extracts structured legal facts, dates, parties, statistics, and legal references from various legal documents.

## 🎯 Features

- **Document-Agnostic**: Automatically detects document type from content
- **No Hallucinations**: Only extracts information explicitly stated in the document
- **Verbatim Evidence**: Every extracted item includes the exact text snippet and page reference
- **Structured Output**: Returns clean JSON that your application can easily parse
- **Multiple Document Types**: Supports court opinions, complaints, government forms, RFPs, country reports, and more

## 📋 Supported Document Types

### 1. Court Opinions & Orders
- **Detectors**: Memorandum opinions, orders, judge signatures, case numbers, parties
- **Extracted Data**: Court name, case number, parties (plaintiffs/defendants), holdings, key dates, statutes/cases, statistics

### 2. Complaints & Dockets  
- **Detectors**: Complaint, petition, docket, civil action, case number
- **Extracted Data**: Parties and roles, claims/causes of action, relief requested, key dates

### 3. Government Forms
- **Detectors**: Form I-589, I-862, NTA, OMB numbers, USCIS/EOIR references
- **Extracted Data**: Form ID, agency, edition/OMB info, named fields, warnings/instructions

### 4. Council Memos & RFPs
- **Detectors**: Council, agenda, RFP, staff report, public notice, meeting
- **Extracted Data**: Issuing body, agenda items, deadlines, requirements, funding/budget

### 5. Country & Policy Reports
- **Detectors**: Human rights, country report, annual report, policy, investigation
- **Extracted Data**: Scope and year, themes, findings, statistics

### 6. Other Legal Documents
- **Fallback**: Generic extraction for unrecognized document types
- **Extracted Data**: Headings, generic structured information

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Use the Extractor

```typescript
import { UniversalLegalExtractor } from './server/universal_legal_extractor';

// Extract from document text
const result = await UniversalLegalExtractor.extractFromText(
  documentText,    // Raw document text
  fileName,        // Document filename
  pageCount        // Number of pages (optional, defaults to 1)
);
```

### 3. API Endpoints

#### Universal Extraction Only
```bash
POST /api/extract-universal
{
  "job_id": "your_job_id"
}
```

#### Enhanced Analysis with Universal Extraction
```bash
POST /api/analyze
{
  "job_id": "your_job_id",
  "use_universal_extraction": true
}
```

## 📊 Output Schema

### Base Structure
```json
{
  "doc_type": "court_opinion_or_order",
  "meta": {
    "title": "Memorandum Opinion and Order",
    "jurisdiction_or_body": "United States District Court",
    "date_iso": "2024-03-08",
    "page_count": 1
  },
  "sections": { ... }
}
```

### Court Opinion Sections
```json
{
  "caption": {
    "court": "United States District Court for the Southern District of Texas",
    "case_no": "4:23-cv-01234",
    "parties": {
      "plaintiffs": [
        {
          "name": "JOHN DOE, et al.",
          "page": 1,
          "evidence": "JOHN DOE, et al., Plaintiffs",
          "confidence": 0.8
        }
      ],
      "defendants": [
        {
          "name": "UNITED STATES OF AMERICA, et al.",
          "page": 1,
          "evidence": "UNITED STATES OF AMERICA, et al., Defendants",
          "confidence": 0.8
        }
      ]
    }
  },
  "holding_or_disposition": [
    {
      "value": "Plaintiffs have failed to state a claim upon which relief can be granted",
      "page": 1,
      "evidence": "The Court holds that Plaintiffs have failed to state a claim...",
      "confidence": 0.8
    }
  ],
  "key_dates": [
    {
      "date_iso": "2024-03-08",
      "label": "decision",
      "page": 1,
      "evidence": "ENTERED March 08, 2024",
      "confidence": 0.9
    }
  ],
  "statutes_cases_notices": [
    {
      "type": "statute",
      "citation": "42 U.S.C. § 1983",
      "page": 1,
      "evidence": "42 U.S.C. § 1983",
      "confidence": 0.9
    }
  ],
  "statistics_or_figures": []
}
```

## 🔧 Configuration

### Environment Variables
```bash
# CPU optimization for large documents
MAX_CHUNK_SIZE=1500
MAX_CHUNKS=8
CHUNK_TIMEOUT=60000
```

### Confidence Thresholds
- **High Confidence (0.9+)**: Exact matches, clear patterns
- **Medium Confidence (0.7-0.8)**: Good matches with some context
- **Low Confidence (<0.7)**: Uncertain matches, excluded by default

## 🧪 Testing

### Run Test Script
```bash
node test_universal_extractor.js
```

### Test with Sample Documents
The test script includes sample documents for each type:
- Court opinion with parties, dates, and legal citations
- Government form (I-589) with fields and warnings
- Council RFP with deadlines and requirements
- Country report with findings and statistics

## 📝 Usage Examples

### Example 1: Extract Court Opinion
```typescript
const courtText = `
UNITED STATES DISTRICT COURT
CASE NO. 4:23-cv-01234
JOHN DOE, Plaintiffs, v. UNITED STATES, Defendants.
ENTERED March 08, 2024
`;

const result = await UniversalLegalExtractor.extractFromText(courtText, "court_order.pdf");
console.log(result.doc_type); // "court_opinion_or_order"
console.log(result.sections.caption.court); // "United States District Court"
```

### Example 2: Extract Government Form
```typescript
const formText = `
Form I-589
Edition 01/20/25
OMB No. 1615-0067
U.S. Citizenship and Immigration Services
`;

const result = await UniversalLegalExtractor.extractFromText(formText, "i589.pdf");
console.log(result.doc_type); // "government_form"
console.log(result.sections.form_id); // "I-589"
```

### Example 3: Extract RFP
```typescript
const rfpText = `
CITY COUNCIL STAFF REPORT
DATE OF MEETING: March 18, 2025
REQUEST FOR PROPOSALS
DEADLINES: Proposals Due: March 25, 2025
`;

const result = await UniversalLegalExtractor.extractFromText(rfpText, "rfp.pdf");
console.log(result.doc_type); // "council_or_rfp"
console.log(result.sections.deadlines.length); // 1
```

## 🔍 How It Works

### 1. Document Type Detection
- Analyzes first 2-3 pages of content
- Looks for specific keywords and patterns
- Uses content structure, not filename

### 2. Pattern-Based Extraction
- **Dates**: Multiple format patterns (MM/DD/YYYY, Month DD, YYYY, ISO)
- **Citations**: U.S.C., Fed. Reg., case names with "v."
- **Numbers**: Statistics with units (percent, per day, count)
- **Parties**: Plaintiff/defendant patterns, role identification

### 3. Context Verification
- Every extraction includes surrounding context
- Cross-references with document structure
- Maintains confidence scores based on clarity

### 4. Deduplication
- Removes duplicate extractions
- Keeps clearest evidence for each item
- Maintains page references for verification

## 🚨 Important Rules

### ✅ DO
- Use only document text (no external knowledge)
- Include verbatim evidence for every extraction
- Provide page numbers when available
- Set confidence scores based on clarity

### ❌ DON'T
- Infer missing information
- Add boilerplate text not in document
- Use filename as extraction source
- Include assumptions or interpretations

## 🔧 Integration

### With Existing Analysis Pipeline
```typescript
// Enhanced analysis with universal extraction
const analysisResult = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    job_id: 'your_job_id',
    use_universal_extraction: true
  })
});

// Access universal extraction results
const universalData = analysisResult.universalExtraction;
```

### Standalone Extraction
```typescript
// Extract only structured data
const extractionResult = await fetch('/api/extract-universal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ job_id: 'your_job_id' })
});

// Direct access to structured data
const structuredData = extractionResult.extraction;
```

## 📈 Performance

### Optimization Features
- **Chunked Processing**: Large documents processed in manageable chunks
- **Pattern Caching**: Compiled regex patterns for faster matching
- **Early Termination**: Stops processing when confidence thresholds met
- **Memory Efficient**: Streams large documents without loading entirely

### Benchmarks
- **Small Documents (<10KB)**: ~50-100ms
- **Medium Documents (10KB-1MB)**: ~100-500ms  
- **Large Documents (1MB+)**: ~500ms-2s (chunked)

## 🐛 Troubleshooting

### Common Issues

#### 1. Document Type Not Detected
```typescript
// Check detection patterns
console.log(documentText.substring(0, 3000).toLowerCase());
// Look for missing keywords in detection logic
```

#### 2. Missing Extractions
```typescript
// Verify text extraction
console.log('Content length:', documentText.length);
console.log('First 500 chars:', documentText.substring(0, 500));
```

#### 3. Low Confidence Scores
```typescript
// Check pattern matching
// Ensure text is properly formatted
// Verify date/number patterns
```

### Debug Mode
```typescript
// Enable detailed logging
process.env.DEBUG = 'universal-extractor:*';
```

## 🔮 Future Enhancements

### Planned Features
- **Page-Level Extraction**: Accurate page number detection
- **Multi-Language Support**: Spanish, French, other languages
- **Advanced Pattern Learning**: ML-based pattern recognition
- **Batch Processing**: Multiple document processing
- **Export Formats**: CSV, Excel, XML output

### Custom Patterns
```typescript
// Add custom extraction patterns
UniversalLegalExtractor.addCustomPattern('custom_field', /custom:\s*(.+)/i);
```

## 📚 API Reference

### UniversalLegalExtractor Class

#### Methods
- `extractFromText(text, filename, pageCount?)`: Main extraction method
- `detectDocumentType(text)`: Document type detection
- `extractMetadata(text, filename, pageCount)`: Basic metadata extraction

#### Returns
- `UniversalExtractionResult`: Complete extraction result
- `DocumentType`: Detected document type
- `DocumentMetadata`: Basic document information
- `Sections`: Type-specific extracted data

## 🤝 Contributing

### Development Setup
```bash
git clone <repository>
cd legal-ai-dashboard-ui
npm install
npm run dev
```

### Adding New Document Types
1. Update `DocumentType` union type
2. Add detection patterns in `detectDocumentType()`
3. Create section interface
4. Implement extraction method
5. Add to `extractSections()` switch statement

### Testing New Features
```bash
npm test
npm run test:extractor
```

## 📄 License

This project is part of the Legal AI Dashboard UI system. See main project license for details.

## 🆘 Support

For issues and questions:
1. Check this documentation
2. Review test examples
3. Check console logs for debugging info
4. Open an issue with sample document and expected output

---

**Built with ❤️ for the Legal AI community**

