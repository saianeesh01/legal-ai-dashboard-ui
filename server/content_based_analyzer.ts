/**
 * Content-Based Document Analyzer
 * Generates detailed analysis based on actual extracted document content
 */

import { EnhancedUniversalExtractor, UniversalExtractionResult } from './enhanced_universal_extractor';

interface ContentAnalysisResult {
  verdict: string;
  confidence: number;
  summary: string;
  improvements: string[];
  toolkit: string[];
  keyFindings: string[];
  documentType: string;
  criticalDates: string[];
  financialTerms: string[];
  complianceRequirements: string[];
  evidence: string[];
  reasoning: string;
  wordCount: number;
  estimatedReadingTime: number;
}

export class ContentBasedAnalyzer {

  /**
   * Analyze document content to generate comprehensive insights
   * Now automatically uses enhanced universal extractor when available
   */
  static async analyzeDocument(fileName: string, content: string): Promise<ContentAnalysisResult> {
    console.log(`Starting content-based analysis for: ${fileName}`);

    if (!content || content.length < 100) {
      console.log(`Insufficient content for analysis: ${content.length} characters`);
      return this.generateFallbackAnalysis(fileName, content);
    }

    try {
      // Try to use enhanced universal extractor first
      console.log(`Attempting enhanced universal extraction for: ${fileName}`);
      const pageCount = Math.ceil(content.length / 2000); // Estimate page count

      const universalResult = await EnhancedUniversalExtractor.extractDocumentInfo(
        content,
        fileName,
        pageCount
      );

      console.log(`Enhanced extraction successful for: ${fileName}, type: ${universalResult.doc_type}`);

      // Map enhanced result to legacy format for compatibility
      const legacyDocumentType = this.mapEnhancedToLegacyType(universalResult.doc_type);
      const legacyVerdict = legacyDocumentType === 'proposal' ? 'proposal' : 'non-proposal';

      // Generate enhanced summary using universal sections
      const enhancedSummary = this.generateEnhancedSummary(universalResult, content);
      const enhancedEvidence = universalResult.evidence;
      const enhancedConfidence = universalResult.confidence;

      return {
        verdict: legacyVerdict,
        confidence: enhancedConfidence,
        summary: enhancedSummary,
        improvements: this.generateEnhancedImprovements(universalResult),
        toolkit: this.generateEnhancedToolkit(universalResult),
        keyFindings: this.extractEnhancedKeyFindings(universalResult),
        documentType: legacyDocumentType,
        criticalDates: this.extractEnhancedDates(universalResult),
        financialTerms: this.extractEnhancedFinancialInfo(universalResult),
        complianceRequirements: this.extractEnhancedComplianceInfo(universalResult),
        evidence: enhancedEvidence,
        reasoning: this.generateEnhancedReasoning(universalResult),
        wordCount: this.countWords(content),
        estimatedReadingTime: Math.ceil(this.countWords(content) / 200)
      };

    } catch (error) {
      console.log('Enhanced extraction not available, using standard analysis');
      // Return standard analysis if enhanced extraction fails
      return this.analyzeDocumentStandard(fileName, content);
    }
  }

  /**
   * Standard document analysis when enhanced extraction is not available
   */
  private static analyzeDocumentStandard(fileName: string, content: string): ContentAnalysisResult {
    console.log(`Using standard analysis for: ${fileName}`);
    
    const wordCount = this.countWords(content);
    const estimatedReadingTime = Math.ceil(wordCount / 200);

    // Extract key information from content
    const documentType = this.classifyDocumentType(content, fileName);
    const verdict = this.determineVerdict(content, documentType);
    const confidence = this.calculateConfidence(content, documentType, verdict);

    const summary = this.generateContentBasedSummary(content, fileName, documentType);
    const keyFindings = this.extractKeyFindings(content, documentType);
    const criticalDates = this.extractDatesFromContent(content);
    const financialTerms = this.extractFinancialInfo(content);
    const complianceRequirements = this.extractComplianceInfo(content, documentType);
    const evidence = this.extractEvidence(content, documentType);
    const reasoning = this.generateReasoning(content, documentType, verdict);

    const improvements = this.generateImprovements(content, documentType);
    const toolkit = this.generateToolkit(documentType);

    console.log(`Standard analysis complete for ${fileName}: ${verdict} (${Math.round(confidence * 100)}% confidence)`);

    return {
      verdict,
      confidence,
      summary,
      improvements,
      toolkit,
      keyFindings,
      documentType,
      criticalDates,
      financialTerms,
      complianceRequirements,
      evidence,
      reasoning,
      wordCount,
      estimatedReadingTime
    };
  }

  /**
   * Enhanced analysis using the universal legal document extractor
   * This provides more detailed extraction while maintaining compatibility
   */
  static async analyzeDocumentEnhanced(
    fileName: string,
    content: string,
    aiModel?: any
  ): Promise<ContentAnalysisResult> {
    console.log(`Starting enhanced universal analysis for: ${fileName}`);

    if (!content || content.length < 100) {
      console.log(`Insufficient content for enhanced analysis: ${content.length} characters`);
      return this.generateFallbackAnalysis(fileName, content);
    }

    try {
      // Use enhanced universal extractor if AI model is available
      if (aiModel) {
        try {
          const pageCount = Math.ceil(content.length / 2000); // Estimate page count
          const universalResult = await EnhancedUniversalExtractor.extractDocumentInfo(
            content,
            fileName,
            pageCount
          );

          // Map enhanced result to legacy format for compatibility
          const legacyDocumentType = this.mapEnhancedToLegacyType(universalResult.doc_type);
          const legacyVerdict = legacyDocumentType === 'proposal' ? 'proposal' : 'non-proposal';

          // Generate enhanced summary using universal sections
          const enhancedSummary = this.generateEnhancedSummary(universalResult, content);
          const enhancedEvidence = universalResult.evidence;
          const enhancedConfidence = universalResult.confidence;

          return {
            verdict: legacyVerdict,
            confidence: enhancedConfidence,
            summary: enhancedSummary,
            improvements: this.generateEnhancedImprovements(universalResult),
            toolkit: this.generateEnhancedToolkit(universalResult),
            keyFindings: this.extractEnhancedKeyFindings(universalResult),
            documentType: legacyDocumentType,
            criticalDates: this.extractEnhancedDates(universalResult),
            financialTerms: this.extractEnhancedFinancialInfo(universalResult),
            complianceRequirements: this.extractEnhancedComplianceInfo(universalResult),
            evidence: enhancedEvidence,
            reasoning: this.generateEnhancedReasoning(universalResult),
            wordCount: this.countWords(content),
            estimatedReadingTime: Math.ceil(this.countWords(content) / 200)
          };
        } catch (error) {
          console.error('Enhanced analysis failed, falling back to standard analysis:', error);
        }
      }
    } catch (error) {
      console.error('Enhanced analysis failed, falling back to standard analysis:', error);
    }

    // Fall back to standard analysis if enhanced analysis fails
    // Note: This would cause infinite recursion, so we need to call the fallback directly
    return this.generateFallbackAnalysis(fileName, content);
  }

  /**
   * Enhanced analysis using the universal extractor (optional enhancement)
   * This method provides additional insights without affecting the core analysis
   */
  static async analyzeWithEnhancedExtractor(
    fileName: string,
    content: string
  ): Promise<ContentAnalysisResult & { enhancedExtraction?: any }> {

    // Get the standard analysis first (maintains existing functionality)
    const standardAnalysis = await this.analyzeDocument(fileName, content);

    try {
      // Import and use the enhanced extractor for additional insights
      const { EnhancedUniversalExtractor } = await import('./enhanced_universal_extractor');

      // Get page count estimate
      const pageCount = Math.ceil(content.length / 2000); // Rough estimate

      // Extract enhanced information
      const enhancedResult = await EnhancedUniversalExtractor.extractDocumentInfo(
        content,
        fileName,
        pageCount
      );

      // Enhance the standard analysis with additional insights
      const enhancedAnalysis = {
        ...standardAnalysis,
        enhancedExtraction: {
          documentType: enhancedResult.doc_type,
          confidence: enhancedResult.confidence,
          metadata: enhancedResult.meta,
          sections: enhancedResult.sections
        }
      };

      return enhancedAnalysis;

    } catch (error) {
      console.log('Enhanced extraction not available, using standard analysis');
      // Return standard analysis if enhanced extraction fails
      return standardAnalysis;
    }
  }

  /**
   * Get enhanced document classification using the universal extractor
   */
  static async getEnhancedDocumentType(content: string): Promise<{ type: string; confidence: number }> {
    try {
      const { EnhancedUniversalExtractor } = await import('./enhanced_universal_extractor');

      // Use the enhanced classifier
      const enhancedType = EnhancedUniversalExtractor.classifyDocumentType(content);

      return {
        type: enhancedType,
        confidence: 0.9 // High confidence for enhanced classification
      };

    } catch (error) {
      // Fallback to existing classification
      const fallbackType = this.classifyDocumentType(content, 'unknown');
      return {
        type: fallbackType,
        confidence: 0.7
      };
    }
  }

  /**
   * Map enhanced document types to legacy types for compatibility
   */
  private static mapEnhancedToLegacyType(enhancedType: string): string {
    const typeMapping: { [key: string]: string } = {
      'court_opinion_or_order': 'court_document',
      'complaint_or_docket': 'court_document',
      'government_form': 'government_form',
      'council_or_rfp': 'government_document',
      'grant_notice_or_rfa': 'proposal',
      'meeting_minutes': 'government_document',
      'procurement_sow_or_contract': 'contract',
      'audit_or_investigation_report': 'report',
      'federal_report_to_congress': 'government_report',
      'country_or_policy_report': 'country_report',
      'academic_program_or_clinic_brochure': 'program_description',
      'proposal_or_whitepaper': 'proposal',
      'other_legal': 'other'
    };

    return typeMapping[enhancedType] || 'other';
  }

  private static countWords(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private static classifyDocumentType(content: string, fileName: string): string {
    const lowerContent = content.toLowerCase();
    const lowerFileName = fileName.toLowerCase();

    // Legal document classification based on content
    if (this.containsPatterns(lowerContent, [
      'notice to appear', 'nta', 'immigration court', 'removal proceedings',
      'alien registration', 'a-number', 'date of hearing'
    ])) {
      return 'nta';
    }

    if (this.containsPatterns(lowerContent, [
      'motion to', 'brief in support', 'memorandum of law', 'legal argument',
      'hereby moves', 'respectfully submits', 'court should grant'
    ])) {
      return 'motion';
    }

    if (this.containsPatterns(lowerContent, [
      'immigration judge', 'decision and order', 'oral decision',
      'immigration court grants', 'immigration court denies', 'ij decision'
    ])) {
      return 'ij_decision';
    }

    if (this.containsPatterns(lowerContent, [
      'country conditions', 'human rights report', 'state department',
      'country information', 'political situation', 'security conditions'
    ])) {
      return 'country_report';
    }

    if (this.containsPatterns(lowerContent, [
      'form i-', 'uscis form', 'application for', 'petition for',
      'biographic information', 'alien number'
    ]) || /form\s+[a-z]-\d+/i.test(lowerContent)) {
      return 'form';
    }

    if (this.containsPatterns(lowerContent, [
      'proposal', 'statement of work', 'scope of services', 'deliverables',
      'project timeline', 'budget estimate', 'rfp response'
    ])) {
      return 'proposal';
    }

    return 'other';
  }

  private static determineVerdict(content: string, documentType: string): string {
    // For legacy compatibility, map to proposal/non-proposal
    return documentType === 'proposal' ? 'proposal' : 'non-proposal';
  }

  private static calculateConfidence(content: string, documentType: string, verdict: string): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on content quality and specificity
    const wordCount = this.countWords(content);
    if (wordCount > 500) confidence += 0.15;
    if (wordCount > 1000) confidence += 0.15;

    // Document type specific confidence boosts
    const lowerContent = content.toLowerCase();

    switch (documentType) {
      case 'nta':
        if (this.containsPatterns(lowerContent, ['notice to appear', 'immigration court', 'a-number'])) {
          confidence += 0.25;
        }
        break;
      case 'motion':
        if (this.containsPatterns(lowerContent, ['motion to', 'hereby moves', 'legal argument'])) {
          confidence += 0.25;
        }
        break;
      case 'proposal':
        if (this.containsPatterns(lowerContent, ['scope of work', 'deliverables', 'timeline'])) {
          confidence += 0.25;
        }
        break;
      case 'country_report':
        if (this.containsPatterns(lowerContent, ['country conditions', 'human rights', 'state department'])) {
          confidence += 0.25;
        }
        break;
    }

    return Math.min(confidence, 0.95); // Cap at 95%
  }

  private static generateContentBasedSummary(content: string, fileName: string, documentType: string): string {
    const wordCount = this.countWords(content);

    // Extract key entities and dates for enhanced summary
    const dates = this.extractDatesFromContent(content);
    const amounts = this.extractFinancialAmounts(content);
    const entities = this.extractNamedEntities(content);

    // Create a comprehensive, unified summary that covers all aspects
    let summary = `This ${wordCount}-word ${this.getDocumentTypeLabel(documentType)} `;

    switch (documentType) {
      case 'nta':
        summary += `appears to be a Notice to Appear for immigration proceedings. `;
        if (dates.length > 0) {
          summary += `Key dates identified: ${dates.slice(0, 3).join(', ')}. `;
        }
        if (entities.length > 0) {
          summary += `Parties involved: ${entities.slice(0, 2).join(', ')}. `;
        }
        break;

      case 'motion':
        summary += `contains legal arguments and motions for court consideration. `;
        if (entities.length > 0) {
          summary += `Key parties: ${entities.slice(0, 2).join(', ')}. `;
        }
        if (dates.length > 0) {
          summary += `Important dates: ${dates.slice(0, 2).join(', ')}. `;
        }
        break;

      case 'proposal':
        summary += `outlines a comprehensive project or service proposal. `;
        if (amounts.length > 0) {
          summary += `Financial terms include: ${amounts.slice(0, 3).join(', ')}. `;
        }
        if (dates.length > 0) {
          summary += `Timeline includes: ${dates.slice(0, 2).join(', ')}. `;
        }
        break;

      case 'country_report':
        summary += `provides detailed country condition information for immigration purposes. `;
        if (entities.length > 0) {
          summary += `Key locations: ${entities.slice(0, 2).join(', ')}. `;
        }
        break;

      case 'ij_decision':
        summary += `documents an Immigration Judge's comprehensive decision. `;
        if (dates.length > 0) {
          summary += `Decision date: ${dates[0]}. `;
        }
        break;

      default:
        summary += `contains comprehensive legal or professional content. `;
        if (dates.length > 0) {
          summary += `Key dates: ${dates.slice(0, 2).join(', ')}. `;
        }
        if (amounts.length > 0) {
          summary += `Financial information: ${amounts.slice(0, 2).join(', ')}. `;
        }
    }

    // Add document-specific details
    if (content.length > 500) {
      const keyPhrases = this.extractKeyPhrases(content);
      if (keyPhrases.length > 0) {
        summary += `Key topics include: ${keyPhrases.slice(0, 3).join(', ')}. `;
      }
    }

    return summary;
  }

  private static extractKeyFindings(content: string, documentType: string): string[] {
    const findings: string[] = [];
    const lowerContent = content.toLowerCase();

    // Extract key phrases and important information
    const importantPhrases = [
      /granted|approved|denied|dismissed/gi,
      /deadline|due date|hearing date/gi,
      /asylum|withholding|cat protection/gi,
      /persecution|harm|torture/gi,
      /country conditions|political situation/gi,
      /legal services|representation|attorney/gi
    ];

    importantPhrases.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.slice(0, 2).forEach(match => {
          const context = this.extractContext(content, match, 100);
          findings.push(`Key finding: ${context}`);
        });
      }
    });

    // Document type specific findings
    switch (documentType) {
      case 'nta':
        if (lowerContent.includes('removal proceedings')) {
          findings.push('Document initiates removal proceedings');
        }
        if (lowerContent.includes('bond')) {
          findings.push('Contains bond-related information');
        }
        break;

      case 'motion':
        if (lowerContent.includes('continuance')) {
          findings.push('Motion for continuance filed');
        }
        if (lowerContent.includes('asylum')) {
          findings.push('Asylum-related motion');
        }
        break;

      case 'proposal':
        if (lowerContent.includes('immigration law')) {
          findings.push('Immigration law services proposed');
        }
        break;
    }

    return findings.slice(0, 5);
  }

  private static extractDatesFromContent(content: string): string[] {
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g,
      /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi,
      /\b\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b/gi
    ];

    const dates: string[] = [];
    datePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        dates.push(...matches.slice(0, 3));
      }
    });

    return Array.from(new Set(dates)).slice(0, 5);
  }

  private static extractFinancialInfo(content: string): string[] {
    const amounts = this.extractFinancialAmounts(content);
    const terms: string[] = [];

    amounts.forEach(amount => {
      const context = this.extractContext(content, amount, 50);
      terms.push(context);
    });

    const financialTerms = [
      /payment terms?/gi,
      /billing/gi,
      /invoice/gi,
      /hourly rate/gi,
      /retainer/gi,
      /costs? and fees?/gi
    ];

    financialTerms.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.slice(0, 2).forEach(match => {
          const context = this.extractContext(content, match, 50);
          terms.push(context);
        });
      }
    });

    return terms.slice(0, 5);
  }

  private static extractFinancialAmounts(content: string): string[] {
    const amountPattern = /\$[\d,]+(?:\.\d{2})?/g;
    const matches = content.match(amountPattern);
    return matches ? Array.from(new Set(matches)).slice(0, 5) : [];
  }

  private static extractComplianceInfo(content: string, documentType: string): string[] {
    const lowerContent = content.toLowerCase();
    const requirements: string[] = [];

    // General legal compliance
    if (lowerContent.includes('comply') || lowerContent.includes('compliance')) {
      requirements.push('Compliance obligations specified');
    }

    if (lowerContent.includes('regulation') || lowerContent.includes('regulatory')) {
      requirements.push('Regulatory requirements referenced');
    }

    // Immigration specific compliance
    if (documentType === 'nta' || documentType === 'motion') {
      if (lowerContent.includes('immigration law')) {
        requirements.push('Immigration law compliance required');
      }
      if (lowerContent.includes('uscis') || lowerContent.includes('ice')) {
        requirements.push('Federal immigration agency requirements');
      }
    }

    return requirements.slice(0, 5);
  }

  private static extractEvidence(content: string, documentType: string): string[] {
    const evidence: string[] = [];

    // Extract quoted text and exhibits
    const quotedText = content.match(/"[^"]{20,100}"/g);
    if (quotedText) {
      evidence.push(`Quoted material: ${quotedText[0]}`);
    }

    // Extract exhibit references
    const exhibits = content.match(/exhibit\s+[a-z0-9]+/gi);
    if (exhibits) {
      evidence.push(`Referenced exhibits: ${exhibits.slice(0, 3).join(', ')}`);
    }

    // Extract case citations
    const citations = content.match(/\b\w+\s+v\.?\s+\w+,?\s+\d+/gi);
    if (citations) {
      evidence.push(`Legal citations: ${citations.slice(0, 2).join(', ')}`);
    }

    return evidence.slice(0, 5);
  }

  private static extractNamedEntities(content: string): string[] {
    // Simple named entity extraction
    const entities: string[] = [];

    // Extract proper nouns (capitalized words)
    const properNouns = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (properNouns) {
      // Filter out common words
      const filtered = properNouns.filter(noun =>
        noun.length > 3 &&
        !['The', 'This', 'That', 'These', 'Those'].includes(noun)
      );
      entities.push(...filtered.slice(0, 5));
    }

    return Array.from(new Set(entities));
  }

  private static extractKeyPhrases(content: string): string[] {
    const phrases: string[] = [];

    // Extract important legal and business phrases
    const keyPhrases = [
      /asylum\s+application/gi,
      /removal\s+proceedings/gi,
      /immigration\s+court/gi,
      /legal\s+services/gi,
      /grant\s+proposal/gi,
      /funding\s+request/gi,
      /court\s+order/gi,
      /legal\s+brief/gi,
      /motion\s+to/gi,
      /country\s+conditions/gi,
      /human\s+rights/gi,
      /veterans\s+benefits/gi,
      /legal\s+aid/gi,
      /pro\s+bono/gi,
      /immigration\s+law/gi
    ];

    keyPhrases.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!phrases.includes(match.toLowerCase())) {
            phrases.push(match.toLowerCase());
          }
        });
      }
    });

    return phrases.slice(0, 5); // Limit to 5 key phrases
  }

  private static generateReasoning(content: string, documentType: string, verdict: string): string {
    const wordCount = this.countWords(content);
    let reasoning = `Classification based on ${wordCount}-word content analysis. `;

    const lowerContent = content.toLowerCase();

    switch (documentType) {
      case 'nta':
        reasoning += 'Document contains Notice to Appear terminology and immigration court references. ';
        break;
      case 'motion':
        reasoning += 'Document contains legal motion language and court filing structure. ';
        break;
      case 'proposal':
        reasoning += 'Document contains proposal elements including scope, deliverables, or project structure. ';
        break;
      case 'country_report':
        reasoning += 'Document contains country condition information and human rights reporting elements. ';
        break;
      default:
        reasoning += 'Document classified based on content patterns and legal document structure. ';
    }

    if (lowerContent.includes('immigration')) {
      reasoning += 'Immigration-related terminology identified. ';
    }

    return reasoning;
  }

  private static generateImprovements(content: string, documentType: string): string[] {
    const improvements: string[] = [];
    const wordCount = this.countWords(content);

    // General improvements based on content analysis
    if (wordCount < 500) {
      improvements.push('Consider expanding document with more detailed information');
    }

    if (!this.containsPatterns(content.toLowerCase(), ['date', 'deadline'])) {
      improvements.push('Add specific dates and deadlines for clarity');
    }

    // Document type specific improvements
    switch (documentType) {
      case 'proposal':
        improvements.push('Include detailed project timeline and milestones');
        improvements.push('Add comprehensive budget breakdown');
        improvements.push('Specify deliverables and success metrics');
        break;

      case 'motion':
        improvements.push('Include relevant case law citations');
        improvements.push('Add factual background section');
        improvements.push('Strengthen legal argument structure');
        break;

      case 'nta':
        improvements.push('Verify all required statutory citations');
        improvements.push('Ensure proper service requirements noted');
        break;

      default:
        improvements.push('Add executive summary or overview section');
        improvements.push('Include relevant supporting documentation');
        improvements.push('Enhance document structure and organization');
    }

    return improvements.slice(0, 5);
  }

  private static generateToolkit(documentType: string): string[] {
    const baseTools = [
      'Westlaw – Legal research and case law database',
      'Microsoft Office – Document creation and editing',
      'Adobe Acrobat – PDF management and editing'
    ];

    switch (documentType) {
      case 'nta':
      case 'motion':
      case 'ij_decision':
        return [
          'EOIR Portal – Immigration court case management',
          'USCIS Website – Immigration forms and guidance',
          'Westlaw Immigration Library – Specialized immigration research',
          'CM/ECF – Federal court electronic filing system',
          ...baseTools
        ];

      case 'proposal':
        return [
          'Microsoft Project – Project management and timelines',
          'QuickBooks – Financial planning and budgeting',
          'Salesforce – Client relationship management',
          'DocuSign – Electronic signature management',
          ...baseTools
        ];

      case 'country_report':
        return [
          'State Department Country Reports – Official government resources',
          'UNHCR Refworld – International protection database',
          'Human Rights Watch – Country condition reports',
          'Immigration Research Library – Country condition research',
          ...baseTools
        ];

      default:
        return baseTools;
    }
  }

  private static containsPatterns(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }

  private static extractContext(content: string, term: string, contextLength: number = 100): string {
    const index = content.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return term;

    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(content.length, index + term.length + contextLength / 2);

    return content.substring(start, end).trim();
  }

  private static getDocumentTypeLabel(documentType: string): string {
    const labels = {
      'nta': 'Notice to Appear',
      'motion': 'legal motion or brief',
      'ij_decision': 'Immigration Judge decision',
      'form': 'immigration form',
      'country_report': 'country conditions report',
      'proposal': 'service proposal',
      'other': 'legal document'
    };

    return labels[documentType as keyof typeof labels] || 'document';
  }

  private static generateFallbackAnalysis(fileName: string, content: string): ContentAnalysisResult {
    return {
      verdict: 'non-proposal',
      confidence: 0.3,
      summary: `Document "${fileName}" could not be fully analyzed due to insufficient readable content. This may be a scanned document that requires OCR processing or a corrupted file. Manual review recommended.`,
      improvements: [
        'Re-upload document in a text-readable format',
        'Ensure document is not corrupted or password-protected',
        'Consider using OCR if document is image-based',
        'Verify file format compatibility'
      ],
      toolkit: [
        'Adobe Acrobat – PDF text recognition and repair',
        'Microsoft Office – Document format conversion',
        'OCR software – Text extraction from images'
      ],
      keyFindings: ['Content extraction failed - unable to analyze document structure'],
      documentType: 'other',
      criticalDates: [],
      financialTerms: [],
      complianceRequirements: [],
      evidence: [],
      reasoning: 'Classification limited due to insufficient readable content',
      wordCount: this.countWords(content),
      estimatedReadingTime: 0
    };
  }

  /**
   * Generate enhanced summary using universal extraction results
   */
  private static generateEnhancedSummary(universalResult: UniversalExtractionResult, content: string): string {
    const { doc_type, meta, sections } = universalResult;

    let summary = `Enhanced analysis identifies this as a ${doc_type.replace(/_/g, ' ')}`;

    if (meta.title) {
      summary += ` titled "${meta.title}"`;
    }

    if (meta.jurisdiction_or_body) {
      summary += ` from ${meta.jurisdiction_or_body}`;
    }

    if (meta.date_iso) {
      summary += ` dated ${meta.date_iso}`;
    }

    summary += `. `;

    // Add document-specific details based on sections
    if (sections) {
      switch (doc_type) {
        case 'grant_notice_or_rfa':
          if (sections.program_name) {
            summary += `Program: ${sections.program_name}. `;
          }
          if (sections.funding_ceiling?.amount) {
            summary += `Funding ceiling: $${sections.funding_ceiling.amount}. `;
          }
          break;

        case 'meeting_minutes':
          if (sections.meeting_datetime_iso) {
            summary += `Meeting held: ${sections.meeting_datetime_iso}. `;
          }
          if (sections.attendees?.length > 0) {
            summary += `${sections.attendees.length} attendees present. `;
          }
          break;

        case 'procurement_sow_or_contract':
          if (sections.agency_or_buyer) {
            summary += `Agency: ${sections.agency_or_buyer}. `;
          }
          if (sections.period_of_performance?.start) {
            summary += `Performance period: ${sections.period_of_performance.start} to ${sections.period_of_performance.end}. `;
          }
          break;

        case 'audit_or_investigation_report':
          if (sections.issuing_body) {
            summary += `Issued by: ${sections.issuing_body}. `;
          }
          if (sections.findings?.length > 0) {
            summary += `${sections.findings.length} findings identified. `;
          }
          break;
      }
    }

    return summary;
  }

  /**
   * Generate enhanced improvements based on universal extraction
   */
  private static generateEnhancedImprovements(universalResult: UniversalExtractionResult): string[] {
    const improvements: string[] = [];
    const { doc_type, sections } = universalResult;

    // Document type specific improvements
    switch (doc_type) {
      case 'grant_notice_or_rfa':
        if (sections.deadlines?.length === 0) {
          improvements.push('Add clear application deadlines');
        }
        if (sections.eligibility?.length === 0) {
          improvements.push('Specify eligibility criteria');
        }
        break;

      case 'meeting_minutes':
        if (sections.actions_or_followups?.length === 0) {
          improvements.push('Include action items and follow-ups');
        }
        break;

      case 'procurement_sow_or_contract':
        if (sections.qualifications?.length === 0) {
          improvements.push('Define vendor qualifications');
        }
        if (sections.compliance?.length === 0) {
          improvements.push('Specify compliance requirements');
        }
        break;

      case 'audit_or_investigation_report':
        if (sections.recommendations?.length === 0) {
          improvements.push('Include actionable recommendations');
        }
        break;
    }

    // Generic improvements if none specific
    if (improvements.length === 0) {
      improvements.push('Enhance document structure and clarity');
      improvements.push('Add specific dates and deadlines where applicable');
      improvements.push('Include measurable objectives or deliverables');
    }

    return improvements.slice(0, 5);
  }

  /**
   * Generate enhanced toolkit recommendations
   */
  private static generateEnhancedToolkit(universalResult: UniversalExtractionResult): string[] {
    const toolkit: string[] = [];
    const { doc_type } = universalResult;

    switch (doc_type) {
      case 'grant_notice_or_rfa':
        toolkit.push('Grant management software for tracking applications');
        toolkit.push('Budget planning tools for financial projections');
        toolkit.push('Project management platform for deliverables');
        break;

      case 'meeting_minutes':
        toolkit.push('Meeting management software for agenda tracking');
        toolkit.push('Action item tracking system');
        toolkit.push('Document collaboration platform');
        break;

      case 'procurement_sow_or_contract':
        toolkit.push('Contract management system');
        toolkit.push('Vendor evaluation tools');
        toolkit.push('Compliance monitoring software');
        break;

      case 'audit_or_investigation_report':
        toolkit.push('Audit trail documentation system');
        toolkit.push('Risk assessment tools');
        toolkit.push('Compliance monitoring dashboard');
        break;

      default:
        toolkit.push('Document management system');
        toolkit.push('Collaboration platform');
        toolkit.push('Version control tools');
    }

    return toolkit.slice(0, 5);
  }

  /**
   * Extract enhanced key findings from universal result
   */
  private static extractEnhancedKeyFindings(universalResult: UniversalExtractionResult): string[] {
    const findings: string[] = [];
    const { doc_type, sections } = universalResult;

    if (sections) {
      switch (doc_type) {
        case 'grant_notice_or_rfa':
          if (sections.funding_ceiling?.amount) {
            findings.push(`Funding available: $${sections.funding_ceiling.amount}`);
          }
          if (sections.deadlines?.length > 0) {
            findings.push(`Key deadline: ${sections.deadlines[0].label} on ${sections.deadlines[0].date_iso}`);
          }
          break;

        case 'meeting_minutes':
          if (sections.motions?.length > 0) {
            findings.push(`Motion ${sections.motions[0].result}: ${sections.motions[0].motion}`);
          }
          break;

        case 'audit_or_investigation_report':
          if (sections.findings?.length > 0) {
            findings.push(`Critical finding: ${sections.findings[0].statement}`);
          }
          break;
      }
    }

    // Add evidence-based findings
    if (universalResult.evidence.length > 0) {
      findings.push(`Document evidence: ${universalResult.evidence[0]}`);
    }

    return findings.slice(0, 5);
  }

  /**
   * Extract enhanced dates from universal result
   */
  private static extractEnhancedDates(universalResult: UniversalExtractionResult): string[] {
    const dates: string[] = [];
    const { doc_type, sections, meta } = universalResult;

    // Add meta date if available
    if (meta.date_iso) {
      dates.push(meta.date_iso);
    }

    // Extract dates from sections
    if (sections) {
      switch (doc_type) {
        case 'grant_notice_or_rfa':
          if (sections.deadlines) {
            sections.deadlines.forEach((deadline: any) => {
              dates.push(`${deadline.label}: ${deadline.date_iso}`);
            });
          }
          break;

        case 'meeting_minutes':
          if (sections.meeting_datetime_iso) {
            dates.push(`Meeting: ${sections.meeting_datetime_iso}`);
          }
          break;

        case 'procurement_sow_or_contract':
          if (sections.period_of_performance) {
            if (sections.period_of_performance.start) {
              dates.push(`Start: ${sections.period_of_performance.start}`);
            }
            if (sections.period_of_performance.end) {
              dates.push(`End: ${sections.period_of_performance.end}`);
            }
          }
          break;
      }
    }

    return dates.slice(0, 5);
  }

  /**
   * Extract enhanced financial information from universal result
   */
  private static extractEnhancedFinancialInfo(universalResult: UniversalExtractionResult): string[] {
    const financialInfo: string[] = [];
    const { doc_type, sections } = universalResult;

    if (sections) {
      switch (doc_type) {
        case 'grant_notice_or_rfa':
          if (sections.funding_ceiling?.amount) {
            financialInfo.push(`Funding ceiling: $${sections.funding_ceiling.amount}`);
          }
          break;

        case 'proposal_or_whitepaper':
          if (sections.budget_or_funding) {
            sections.budget_or_funding.forEach((budget: any) => {
              if (budget.amount) {
                financialInfo.push(`${budget.context}: $${budget.amount}`);
              }
            });
          }
          break;
      }
    }

    return financialInfo.slice(0, 5);
  }

  /**
   * Extract enhanced compliance information from universal result
   */
  private static extractEnhancedComplianceInfo(universalResult: UniversalExtractionResult): string[] {
    const complianceInfo: string[] = [];
    const { doc_type, sections } = universalResult;

    if (sections) {
      switch (doc_type) {
        case 'procurement_sow_or_contract':
          if (sections.compliance) {
            sections.compliance.forEach((compliance: any) => {
              complianceInfo.push(compliance.standard_or_policy);
            });
          }
          break;

        case 'grant_notice_or_rfa':
          if (sections.eligibility) {
            sections.eligibility.forEach((eligibility: any) => {
              complianceInfo.push(`Eligibility: ${eligibility.criterion}`);
            });
          }
          break;
      }
    }

    return complianceInfo.slice(0, 5);
  }

  /**
   * Generate enhanced reasoning based on universal result
   */
  private static generateEnhancedReasoning(universalResult: UniversalExtractionResult): string {
    const { doc_type, confidence, evidence } = universalResult;

    let reasoning = `Document classified as ${doc_type.replace(/_/g, ' ')} with ${Math.round(confidence * 100)}% confidence. `;

    if (evidence.length > 0) {
      reasoning += `Evidence includes: ${evidence.slice(0, 2).join(', ')}. `;
    }

    reasoning += `This classification is based on content analysis using enhanced legal document extraction patterns.`;

    return reasoning;
  }
}