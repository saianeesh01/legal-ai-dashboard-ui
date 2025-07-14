/**
 * Smart AI Document Classifier
 * Analyzes actual document content to determine if it's a proposal or not
 * Uses advanced content analysis instead of template matching
 */

export interface SmartClassificationResult {
  verdict: 'proposal' | 'non-proposal';
  confidence: number;
  evidence: string[];
  reasoning: string;
  contentAnalysis: {
    hasRequestLanguage: boolean;
    hasTimelines: boolean;
    hasFinancialTerms: boolean;
    hasDeliverables: boolean;
    hasApplication: boolean;
    documentType: string;
  };
}

export class SmartLegalClassifier {
  
  /**
   * Analyze document content to determine if it's a proposal
   */
  static analyzeDocument(fileName: string, content: string): SmartClassificationResult {
    console.log(`Smart classifier analyzing: ${fileName}`);
    console.log(`Content length: ${content.length} characters`);
    
    const normalizedContent = content.toLowerCase();
    const evidence: string[] = [];
    let confidence = 0.5; // Start with neutral
    
    // Content analysis flags
    const contentAnalysis = {
      hasRequestLanguage: false,
      hasTimelines: false,
      hasFinancialTerms: false,
      hasDeliverables: false,
      hasApplication: false,
      documentType: 'unknown'
    };
    
    // 1. REQUEST LANGUAGE ANALYSIS
    const requestPatterns = [
      /(?:request|requesting|seek|seeking|apply|applying)\s+(?:for|to)/i,
      /(?:funding|grant|support|assistance)\s+(?:for|to|is|will)/i,
      /(?:propose|proposal|proposes)\s+(?:to|for|that)/i,
      /(?:establish|create|implement|develop)\s+(?:a|an|the)/i,
      /(?:we|our organization|this proposal)\s+(?:will|would|plans?)/i
    ];
    
    for (const pattern of requestPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        contentAnalysis.hasRequestLanguage = true;
        evidence.push(`Request language found: "${matches[0]}"`);
        confidence += 0.15;
        break;
      }
    }
    
    // 2. FUNDING/GRANT ANALYSIS
    const fundingPatterns = [
      /\$[\d,]+(?:\.\d{2})?\s*(?:grant|funding|budget|cost|amount)/i,
      /(?:annual|total|requested)\s+(?:funding|budget|amount|cost):\s*\$[\d,]+/i,
      /(?:funding|grant)\s+(?:opportunity|program|initiative)/i,
      /(?:eligib|application|deadline|submission)/i
    ];
    
    for (const pattern of fundingPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        contentAnalysis.hasFinancialTerms = true;
        evidence.push(`Funding language found: "${matches[0]}"`);
        confidence += 0.12;
        break;
      }
    }
    
    // 3. TIMELINE ANALYSIS
    const timelinePatterns = [
      /(?:implementation|project|program)\s+(?:timeline|schedule|plan)/i,
      /(?:phase|stage|milestone|deadline|due)/i,
      /(?:year|month|quarter|semester)\s+(?:one|two|1|2|first|second)/i,
      /(?:launch|start|begin|commence)\s+(?:date|on|by)/i
    ];
    
    for (const pattern of timelinePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        contentAnalysis.hasTimelines = true;
        evidence.push(`Timeline language found: "${matches[0]}"`);
        confidence += 0.10;
        break;
      }
    }
    
    // 4. DELIVERABLES ANALYSIS
    const deliverablesPatterns = [
      /(?:deliverables?|outcomes?|objectives?|goals?)/i,
      /(?:services?\s+(?:provided|offered|delivered)|service\s+delivery)/i,
      /(?:scope\s+of\s+work|work\s+plan|project\s+plan)/i,
      /(?:target\s+(?:population|audience|beneficiaries))/i
    ];
    
    for (const pattern of deliverablesPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        contentAnalysis.hasDeliverables = true;
        evidence.push(`Deliverables language found: "${matches[0]}"`);
        confidence += 0.08;
        break;
      }
    }
    
    // 5. APPLICATION ANALYSIS
    const applicationPatterns = [
      /(?:application|proposal)\s+(?:for|to|deadline|submission)/i,
      /(?:submit|submission|due|deadline)\s+(?:by|on|before)/i,
      /(?:grant|funding)\s+(?:application|proposal|request)/i,
      /(?:eligib|qualify|qualification|requirement)/i
    ];
    
    for (const pattern of applicationPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        contentAnalysis.hasApplication = true;
        evidence.push(`Application language found: "${matches[0]}"`);
        confidence += 0.10;
        break;
      }
    }
    
    // 6. ENHANCED DOCUMENT TYPE DETECTION
    // Check filename first for stronger indicators
    const filenameType = this.getDocumentTypeFromFilename(fileName);
    if (filenameType) {
      contentAnalysis.documentType = filenameType.type;
      evidence.push(`Filename indicates: ${filenameType.description}`);
      confidence += filenameType.confidence;
    }
    
    // Then check content for additional context
    if (normalizedContent.includes('clinic') && (normalizedContent.includes('grant') || normalizedContent.includes('funding'))) {
      if (contentAnalysis.documentType === 'unknown') contentAnalysis.documentType = 'clinic_grant';
      evidence.push('Document type: Legal clinic grant/funding');
      confidence += 0.08;
    } else if (normalizedContent.includes('proposal') || normalizedContent.includes('rfp')) {
      if (contentAnalysis.documentType === 'unknown') contentAnalysis.documentType = 'proposal';
      evidence.push('Document type: Proposal or RFP');
      confidence += 0.10;
    } else if (normalizedContent.includes('contract') || normalizedContent.includes('agreement')) {
      if (contentAnalysis.documentType === 'unknown') contentAnalysis.documentType = 'contract';
      evidence.push('Document type: Contract or agreement');
      confidence -= 0.10;
    } else if (normalizedContent.includes('court') || normalizedContent.includes('opinion')) {
      if (contentAnalysis.documentType === 'unknown') contentAnalysis.documentType = 'legal_document';
      evidence.push('Document type: Legal court document');
      confidence -= 0.15;
    } else if (normalizedContent.includes('council') || normalizedContent.includes('board')) {
      if (contentAnalysis.documentType === 'unknown') contentAnalysis.documentType = 'administrative';
      evidence.push('Document type: Administrative/board document');
      confidence -= 0.12;
    }
    
    // 7. FILENAME ANALYSIS
    const filenameAnalysis = this.analyzeFileName(fileName);
    if (filenameAnalysis.isProposal) {
      evidence.push(`Filename suggests proposal: "${fileName}"`);
      confidence += 0.08;
    } else if (filenameAnalysis.isNonProposal) {
      evidence.push(`Filename suggests non-proposal: "${fileName}"`);
      confidence -= 0.08;
    }
    
    // 8. CONTENT STRUCTURE ANALYSIS
    const structureScore = this.analyzeContentStructure(content);
    confidence += structureScore.adjustment;
    if (structureScore.evidence.length > 0) {
      evidence.push(...structureScore.evidence);
    }
    
    // Enhanced confidence boosting for clear indicators
    if (contentAnalysis.documentType === 'proposal' && evidence.length >= 2) {
      confidence += 0.15; // Boost for clear proposal document type
    }
    
    if (contentAnalysis.documentType === 'clinic_grant' && evidence.length >= 1) {
      confidence += 0.20; // Higher boost for clinic grant documents
    }
    
    // Filename-based confidence boosting
    if (filenameAnalysis.isProposal && evidence.length >= 1) {
      confidence += 0.10; // Boost when filename and content align
    }
    
    // Multiple evidence types boost confidence
    const evidenceTypes = [
      contentAnalysis.hasRequestLanguage,
      contentAnalysis.hasFinancialTerms,
      contentAnalysis.hasTimelines,
      contentAnalysis.hasDeliverables,
      contentAnalysis.hasApplication
    ].filter(Boolean).length;
    
    if (evidenceTypes >= 2) {
      confidence += 0.12; // Boost for multiple evidence types
    }
    
    if (evidenceTypes >= 3) {
      confidence += 0.08; // Additional boost for strong evidence
    }
    
    // Final determination with improved thresholds
    const verdict: 'proposal' | 'non-proposal' = confidence > 0.55 ? 'proposal' : 'non-proposal';
    const finalConfidence = Math.min(Math.max(confidence, 0.15), 0.95);
    
    const reasoning = this.generateReasoning(verdict, finalConfidence, contentAnalysis);
    
    console.log(`Smart classification result for ${fileName}:`);
    console.log(`  Verdict: ${verdict}`);
    console.log(`  Confidence: ${finalConfidence.toFixed(2)}`);
    console.log(`  Evidence count: ${evidence.length}`);
    console.log(`  Content analysis:`, contentAnalysis);
    
    return {
      verdict,
      confidence: finalConfidence,
      evidence,
      reasoning,
      contentAnalysis
    };
  }
  
  /**
   * Analyze filename for proposal indicators
   */
  private static analyzeFileName(fileName: string): { isProposal: boolean; isNonProposal: boolean } {
    const normalizedName = fileName.toLowerCase();
    
    // Enhanced proposal keywords with more specific matching
    const strongProposalKeywords = ['proposal', 'grant', 'funding', 'application', 'rfp', 'clinic'];
    const moderateProposalKeywords = ['request', 'petition', 'submission', 'bid'];
    
    // Enhanced non-proposal keywords
    const strongNonProposalKeywords = ['opinion', 'ruling', 'order', 'docket', 'case', 'council', 'board', 'meeting', 'minutes', 'agenda'];
    const moderateNonProposalKeywords = ['report', 'summary', 'analysis', 'review'];
    
    const hasStrongProposal = strongProposalKeywords.some(keyword => normalizedName.includes(keyword));
    const hasModerateProposal = moderateProposalKeywords.some(keyword => normalizedName.includes(keyword));
    const hasStrongNonProposal = strongNonProposalKeywords.some(keyword => normalizedName.includes(keyword));
    const hasModerateNonProposal = moderateNonProposalKeywords.some(keyword => normalizedName.includes(keyword));
    
    // Strong indicators override moderate ones
    const isProposal = hasStrongProposal || (hasModerateProposal && !hasStrongNonProposal);
    const isNonProposal = hasStrongNonProposal || (hasModerateNonProposal && !hasStrongProposal);
    
    return { isProposal, isNonProposal };
  }
  
  /**
   * Get document type from filename with confidence scoring
   */
  private static getDocumentTypeFromFilename(fileName: string): { type: string; description: string; confidence: number } | null {
    const normalizedName = fileName.toLowerCase();
    
    // Veterans/Legal Clinic proposals
    if (normalizedName.includes('veteran') && normalizedName.includes('proposal')) {
      return { type: 'clinic_grant', description: 'Veterans clinic proposal', confidence: 0.25 };
    }
    if (normalizedName.includes('clinic') && normalizedName.includes('proposal')) {
      return { type: 'clinic_grant', description: 'Legal clinic proposal', confidence: 0.25 };
    }
    
    // Grant applications
    if (normalizedName.includes('grant') && normalizedName.includes('application')) {
      return { type: 'clinic_grant', description: 'Grant application', confidence: 0.20 };
    }
    if (normalizedName.includes('grant') && normalizedName.includes('proposal')) {
      return { type: 'clinic_grant', description: 'Grant proposal', confidence: 0.20 };
    }
    
    // General proposals
    if (normalizedName.includes('proposal')) {
      return { type: 'proposal', description: 'Proposal document', confidence: 0.15 };
    }
    if (normalizedName.includes('rfp')) {
      return { type: 'proposal', description: 'RFP document', confidence: 0.15 };
    }
    
    // Administrative documents
    if (normalizedName.includes('council') || normalizedName.includes('board')) {
      return { type: 'administrative', description: 'Administrative document', confidence: -0.10 };
    }
    if (normalizedName.includes('meeting') || normalizedName.includes('minutes')) {
      return { type: 'administrative', description: 'Meeting document', confidence: -0.12 };
    }
    
    return null;
  }
  
  /**
   * Analyze content structure for proposal characteristics
   */
  private static analyzeContentStructure(content: string): { adjustment: number; evidence: string[] } {
    const evidence: string[] = [];
    let adjustment = 0;
    
    // Look for structured proposal sections
    const structurePatterns = [
      { pattern: /executive\s+summary/i, weight: 0.10, label: 'Executive Summary section' },
      { pattern: /budget\s+(?:summary|breakdown|request)/i, weight: 0.08, label: 'Budget section' },
      { pattern: /implementation\s+plan/i, weight: 0.08, label: 'Implementation plan' },
      { pattern: /project\s+(?:description|overview|summary)/i, weight: 0.06, label: 'Project description' },
      { pattern: /performance\s+(?:metrics|indicators|measures)/i, weight: 0.06, label: 'Performance metrics' },
      { pattern: /evaluation\s+(?:plan|criteria|methodology)/i, weight: 0.06, label: 'Evaluation methodology' }
    ];
    
    for (const { pattern, weight, label } of structurePatterns) {
      if (pattern.test(content)) {
        adjustment += weight;
        evidence.push(`Structured section found: ${label}`);
      }
    }
    
    // Look for non-proposal structures
    const nonProposalPatterns = [
      { pattern: /minutes\s+of\s+(?:meeting|board)/i, weight: -0.10, label: 'Meeting minutes structure' },
      { pattern: /agenda\s+(?:item|for)/i, weight: -0.08, label: 'Agenda structure' },
      { pattern: /motion\s+(?:to|for|that)/i, weight: -0.08, label: 'Motion language' },
      { pattern: /whereas\s+[A-Z]/i, weight: -0.06, label: 'Whereas clause (legal document)' }
    ];
    
    for (const { pattern, weight, label } of nonProposalPatterns) {
      if (pattern.test(content)) {
        adjustment += weight;
        evidence.push(`Non-proposal structure: ${label}`);
      }
    }
    
    return { adjustment, evidence };
  }
  
  /**
   * Generate human-readable reasoning
   */
  private static generateReasoning(verdict: string, confidence: number, analysis: any): string {
    const indicators = [];
    
    if (analysis.hasRequestLanguage) indicators.push('request language');
    if (analysis.hasFinancialTerms) indicators.push('financial terms');
    if (analysis.hasTimelines) indicators.push('project timelines');
    if (analysis.hasDeliverables) indicators.push('deliverables');
    if (analysis.hasApplication) indicators.push('application elements');
    
    if (verdict === 'proposal') {
      return `Document classified as proposal based on ${indicators.join(', ')}. Confidence: ${Math.round(confidence * 100)}%`;
    } else {
      return `Document classified as non-proposal. ${indicators.length > 0 ? `Some proposal elements found (${indicators.join(', ')}) but insufficient for classification.` : 'No significant proposal indicators found.'} Confidence: ${Math.round(confidence * 100)}%`;
    }
  }
}