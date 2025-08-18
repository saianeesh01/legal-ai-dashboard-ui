# Enhanced Universal Legal Document Extractor

## Overview

This enhanced extractor expands your existing Legal AI analysis pipeline to handle **13 document types** including the new categories you requested:

- **Law clinic brochures** → `academic_program_or_clinic_brochure`
- **Grant notices/RFAs** → `grant_notice_or_rfa` 
- **Meeting minutes** → `meeting_minutes`
- **Statements of Work (SOW)/contracts** → `procurement_sow_or_contract`
- **Audit/investigation reports** → `audit_or_investigation_report`
- **Federal reports to Congress** → `federal_report_to_congress`
- **Proposals/white papers** → `proposal_or_whitepaper`

## Integration with Existing Pipeline

The enhanced extractor is designed to work **alongside** your existing analysis without breaking changes:

### 1. **Backward Compatible**
- All existing methods continue to work exactly as before
- New enhanced analysis is available as an **optional upgrade**
- Falls back to standard analysis if enhanced analysis fails

### 2. **Two Analysis Modes**

#### **Standard Mode** (Existing)
```typescript
import { ContentBasedAnalyzer } from './server/content_based_analyzer';

const result = ContentBasedAnalyzer.analyzeDocument(fileName, content);
// Returns: { verdict, confidence, summary, improvements, toolkit, ... }
```

#### **Enhanced Mode** (New)
```typescript
import { ContentBasedAnalyzer } from './server/content_based_analyzer';
import { OllamaClient } from './ai_service/app'; // Your existing Ollama client

const ollamaClient = new OllamaClient();
const enhancedResult = await ContentBasedAnalyzer.analyzeDocumentEnhanced(
  fileName, 
  content, 
  ollamaClient
);
// Returns: Enhanced analysis with detailed sections + legacy compatibility
```

## Key Features

### **Evidence-Based Extraction**
- Every extracted item includes **verbatim snippets** and **page numbers**
- **No hallucination** - only facts explicitly stated in the document
- Confidence scoring based on extraction quality

### **Rich Document Schemas**
Each document type has specialized extraction fields:

#### **Grant Notice/RFA Example**
```json
{
  "doc_type": "grant_notice_or_rfa",
  "sections": {
    "program_name": "Immigration Legal Services Grant",
    "funding_ceiling": {"amount": 500000, "currency": "USD", "page": 3, "evidence": "Funding ceiling: $500,000"},
    "deadlines": [
      {"date_iso": "2024-12-15", "label": "application", "page": 5, "evidence": "Applications due December 15, 2024"}
    ],
    "eligibility": [
      {"criterion": "Non-profit organizations", "page": 4, "evidence": "Eligible applicants include non-profit organizations"}
    ]
  }
}
```

#### **Meeting Minutes Example**
```json
{
  "doc_type": "meeting_minutes",
  "sections": {
    "meeting_datetime_iso": "2024-11-20T14:00:00",
    "attendees": [
      {"name": "John Smith", "role": "trustee", "page": 1, "evidence": "Present: John Smith, Trustee"}
    ],
    "motions": [
      {"motion": "Approve budget", "result": "passed", "vote": "5-0", "page": 2, "evidence": "Motion to approve budget passed 5-0"}
    ]
  }
}
```

## Usage Examples

### **Basic Integration**
```typescript
// In your existing analysis route
app.post('/analyze', async (req, res) => {
  const { fileName, content } = req.body;
  
  try {
    // Try enhanced analysis first
    const result = await ContentBasedAnalyzer.analyzeDocumentEnhanced(
      fileName, 
      content, 
      ollamaClient
    );
    
    res.json(result);
  } catch (error) {
    // Fall back to standard analysis
    const fallbackResult = ContentBasedAnalyzer.analyzeDocument(fileName, content);
    res.json(fallbackResult);
  }
});
```

### **Document Type Detection**
```typescript
// Check what type of document was detected
if (result.documentType === 'grant_notice_or_rfa') {
  console.log('This is a grant opportunity!');
  // Access grant-specific fields
  const funding = result.financialTerms;
  const deadlines = result.criticalDates;
}
```

### **Enhanced Evidence Access**
```typescript
// Get detailed evidence for any extracted information
result.evidence.forEach(evidence => {
  console.log(`Evidence: ${evidence}`);
});

// Access structured sections if available
if (result.sections?.deadlines) {
  result.sections.deadlines.forEach(deadline => {
    console.log(`Deadline: ${deadline.label} on ${deadline.date_iso}`);
    console.log(`Source: ${deadline.evidence} [Page ${deadline.page}]`);
  });
}
```

## Configuration

### **AI Model Settings**
The enhanced extractor uses your existing Ollama setup:
- **Model**: `mistral:7b-instruct-q4_0` (configurable)
- **Max Tokens**: 2000 (adjustable for complex documents)
- **Temperature**: Low (0.3) for factual extraction

### **Fallback Behavior**
- If AI model is unavailable → Standard analysis
- If JSON parsing fails → Fallback result
- If extraction errors occur → Graceful degradation

## Benefits

### **1. Expanded Coverage**
- **13 document types** vs. previous 6-7
- Specialized extraction for each category
- Better handling of complex legal documents

### **2. Evidence-Based Analysis**
- **No more generic responses**
- Every claim backed by document text
- Page-specific citations for verification

### **3. Maintains Compatibility**
- **Zero breaking changes** to existing code
- Gradual migration path
- Same API interface

### **4. Enhanced Insights**
- **Detailed sections** for each document type
- **Structured data** for programmatic access
- **Rich metadata** extraction

## Migration Path

### **Phase 1: Add Enhanced Extractor**
- Import and test with sample documents
- Verify enhanced analysis works
- Keep existing analysis as fallback

### **Phase 2: Gradual Rollout**
- Use enhanced analysis for new uploads
- Compare results with existing analysis
- Monitor confidence scores and evidence quality

### **Phase 3: Full Integration**
- Default to enhanced analysis
- Use standard analysis only for fallback
- Leverage enhanced sections for UI improvements

## Troubleshooting

### **Common Issues**

1. **AI Model Not Available**
   - Falls back to standard analysis automatically
   - Check Ollama service status

2. **JSON Parsing Errors**
   - Enhanced extractor handles malformed responses
   - Returns fallback result with error logging

3. **Memory Issues with Large Documents**
   - Adjust `max_tokens` parameter
   - Consider chunking very long documents

### **Performance Tips**

- **Batch Processing**: Process multiple documents sequentially
- **Caching**: Cache enhanced results for repeated analysis
- **Async Processing**: Use enhanced analysis in background jobs

## Future Enhancements

- **Custom Document Types**: Add organization-specific schemas
- **Multi-Language Support**: Extract from non-English documents
- **Template Learning**: Improve extraction based on document patterns
- **Confidence Calibration**: Fine-tune confidence scoring

---

The enhanced extractor gives you **professional-grade document analysis** while maintaining **100% compatibility** with your existing Legal AI pipeline. Start with enhanced analysis for new documents and gradually expand coverage based on your needs.

