/**
 * Smart AI Document Classifier
 * Analyzes actual document content to determine if it's a proposal or not
 * Uses advanced content analysis instead of template matching
 */

export interface SmartClassificationResult {
  verdict: 'proposal' | 'non-proposal' | 'undetermined';
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
    hasCourtIndicators: boolean;
    hasLitigationTerms: boolean;
  };
}

export class SmartLegalClassifier {
  
  /**
   * Analyze document content to determine if it's a proposal with evidence-based classification
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
      hasCourtIndicators: false,
      hasLitigationTerms: false,
      documentType: 'unknown'
    };
    
    // CRITICAL: Check for court/litigation indicators first (negative evidence)
    const courtIndicators = [
      /UNITED STATES COURT OF APPEALS/i,
      /UNITED STATES DISTRICT COURT/i,
      /ORDER\s+(?:No\.?\s*\d+|\d+)/i,
      /motion for stay pending appeal/i,
      /plaintiffs?[\s\-–—]+appellees?/i,
      /defendants?[\s\-–—]+appellants?/i,
      /v\.\s+[A-Z][a-z]+/i, // "v. DHS" pattern
      /OPINION|JUDGMENT|DECREE/i,
      /MEMORANDUM AND ORDER/i,
      /(?:denied|granted|dismissed)/i
    ];
    
    for (const pattern of courtIndicators) {
      const matches = content.match(pattern);
      if (matches) {
        contentAnalysis.hasCourtIndicators = true;
        evidence.push(`Court document indicator: "${matches[0]}"`);
        confidence -= 0.4; // Strong negative evidence
        break;
      }
    }
    
    // Check for litigation terms
    const litigationTerms = [
      /(?:motion|petition|complaint|brief|pleading)/i,
      /(?:plaintiff|defendant|appellant|appellee)/i,
      /(?:docket|case number|civil action)/i,
      /(?:injunction|restraining order|stay)/i,
      /(?:discovery|deposition|interrogatory)/i
    ];
    
    for (const pattern of litigationTerms) {
      const matches = content.match(pattern);
      if (matches) {
        contentAnalysis.hasLitigationTerms = true;
        evidence.push(`Litigation term found: "${matches[0]}"`);
        confidence -= 0.2; // Moderate negative evidence
        break;
      }
    }
    
    // Only proceed with positive analysis if no strong court indicators
    if (!contentAnalysis.hasCourtIndicators) {
      // 1. REQUEST LANGUAGE ANALYSIS (requires actual funding context)
      const requestPatterns = [
        /(?:request|requesting|seek|seeking)\s+(?:funding|grant|support)/i,
        /(?:applying|application)\s+for\s+(?:funding|grant|support)/i,
        /(?:propose|proposal)\s+(?:to|for)\s+(?:establish|create|implement)/i,
        /(?:we|our organization|this proposal)\s+(?:will|would|plans?)\s+(?:provide|establish|create)/i
      ];
      
      for (const pattern of requestPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          contentAnalysis.hasRequestLanguage = true;
          evidence.push(`Request language: "${matches[0]}"`);
          confidence += 0.15;
          break;
        }
      }
      
      // 2. FUNDING/GRANT ANALYSIS (requires specific monetary/funding context)
      const fundingPatterns = [
        /\$[\d,]+(?:\.\d{2})?\s*(?:grant|funding|budget|requested|annually)/i,
        /(?:total|annual|requested)\s+(?:funding|budget|amount):\s*\$[\d,]+/i,
        /(?:grant|funding)\s+(?:opportunity|program|initiative|request)/i,
        /(?:budget|cost)\s+breakdown|(?:personnel|operational)\s+costs/i
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
      
      // 3. TIMELINE ANALYSIS (only if no court indicators)
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
      
      // 4. DELIVERABLES ANALYSIS (only if no court indicators)
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
      
      // 5. APPLICATION ANALYSIS (only if no court indicators)
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
    }
    
    // 6. FILENAME ANALYSIS
    const filenameAnalysis = this.analyzeFileName(fileName);
    if (filenameAnalysis.isProposal && !contentAnalysis.hasCourtIndicators) {
      evidence.push(`Filename suggests proposal: "${fileName}"`);
      confidence += 0.08;
    } else if (filenameAnalysis.isNonProposal) {
      evidence.push(`Filename suggests non-proposal: "${fileName}"`);
      confidence -= 0.08;
    }
    
    // 7. DOCUMENT TYPE DETECTION
    const filenameType = this.getDocumentTypeFromFilename(fileName);
    if (filenameType) {
      contentAnalysis.documentType = filenameType.type;
      evidence.push(`Filename indicates: ${filenameType.description}`);
      if (!contentAnalysis.hasCourtIndicators) {
        confidence += filenameType.confidence;
      }
    }
    
    // CRITICAL: Apply sanity check for court documents
    const sanityCheckResult = this.applySanityCheck({
      verdict: confidence > 0.55 ? 'proposal' : 'non-proposal',
      confidence,
      evidence,
      contentAnalysis
    });
    
    let finalVerdict = sanityCheckResult.verdict;
    let finalConfidence = sanityCheckResult.confidence;
    
    // Evidence requirement: Must have at least 2 pieces of evidence for high confidence
    if (evidence.length < 2 && !contentAnalysis.hasCourtIndicators) {
      finalVerdict = 'non-proposal' as const;
      finalConfidence = 0.40;
      evidence.push('Insufficient evidence for confident classification');
    }
    
    // Court document override
    if (contentAnalysis.hasCourtIndicators) {
      finalVerdict = 'non-proposal';
      finalConfidence = Math.max(0.85, finalConfidence);
      contentAnalysis.documentType = 'court_document';
    }
    
    // Enhanced confidence boosting for clear indicators (only if not court document)
    if (!contentAnalysis.hasCourtIndicators) {
      if (contentAnalysis.documentType === 'clinic_grant' && evidence.length >= 2) {
        finalConfidence += 0.15; // Boost for clinic grant documents
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
        finalConfidence += 0.10; // Boost for multiple evidence types
      }
      
      if (evidenceTypes >= 3) {
        finalConfidence += 0.08; // Additional boost for strong evidence
      }
    }
    
    // Final confidence normalization
    finalConfidence = Math.min(Math.max(finalConfidence, 0.15), 0.95);
    
    const reasoning = this.generateReasoning(finalVerdict, finalConfidence, contentAnalysis);
    
    console.log(`Smart classification result for ${fileName}:`);
    console.log(`  Verdict: ${finalVerdict}`);
    console.log(`  Confidence: ${finalConfidence.toFixed(2)}`);
    console.log(`  Evidence count: ${evidence.length}`);
    console.log(`  Content analysis:`, contentAnalysis);
    
    return {
      verdict: finalVerdict,
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
   * Apply sanity check to prevent court documents from being classified as proposals
   */
  private static applySanityCheck(result: {
    verdict: 'proposal' | 'non-proposal';
    confidence: number;
    evidence: string[];
    contentAnalysis: any;
  }): { verdict: 'proposal' | 'non-proposal'; confidence: number } {
    const evidenceText = result.evidence.join(' ').toLowerCase();
    
    // Check for court document indicators
    const hasCourtCue = /(v\.)|(order)|(opinion)|(plaintiff)|(defendant)|(court of appeals)|(district court)|(motion|stay)/i.test(evidenceText);
    
    // Check for funding/grant indicators
    const hasFundingCue = /(grant)|(budget)|(dollar)|(funding)|(proposal)|(application for funding)/i.test(evidenceText);
    
    // If has court indicators but no funding context, it's definitely not a proposal
    if (hasCourtCue && !hasFundingCue) {
      return {
        verdict: 'non-proposal',
        confidence: 0.85 // High confidence for court documents
      };
    }
    
    // If has strong court indicators even with some funding language, still not a proposal
    if (result.contentAnalysis.hasCourtIndicators) {
      return {
        verdict: 'non-proposal',
        confidence: 0.90 // Very high confidence for clear court documents
      };
    }
    
    return {
      verdict: result.verdict,
      confidence: result.confidence
    };
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
    
    // Check for court document indicators
    const courtIndicators = [];
    if (analysis.hasCourtIndicators) courtIndicators.push('court document indicators');
    if (analysis.hasLitigationTerms) courtIndicators.push('litigation terms');
    
    if (verdict === 'proposal') {
      return `Document classified as proposal based on ${indicators.join(', ')}. Confidence: ${Math.round(confidence * 100)}%`;
    } else if (verdict === 'non-proposal') {
      if (courtIndicators.length > 0) {
        return `Document classified as non-proposal due to ${courtIndicators.join(', ')}. This appears to be a court or legal document. Confidence: ${Math.round(confidence * 100)}%`;
      }
      return `Document classified as non-proposal. ${indicators.length > 0 ? `Some proposal elements found (${indicators.join(', ')}) but insufficient for classification.` : 'No significant proposal indicators found.'} Confidence: ${Math.round(confidence * 100)}%`;
    } else {
      return `Document classification is undetermined. ${indicators.length > 0 ? `Some indicators found (${indicators.join(', ')}) but insufficient evidence.` : 'Insufficient evidence for confident classification.'} Confidence: ${Math.round(confidence * 100)}%`;
    }
  }
}