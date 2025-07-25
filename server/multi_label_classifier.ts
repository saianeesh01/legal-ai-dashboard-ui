/**
 * Multi-Label Document Type Classifier
 * Enhanced classification system for legal documents with granular categorization
 * Based on evidence-based classification with specialized immigration law support
 */

export interface MultiLabelClassificationResult {
  document_type: 'proposal' | 'nta' | 'motion' | 'ij_decision' | 'form' | 'country_report' | 'administrative' | 'other' | 'undetermined';
  confidence: number;
  evidence: string[];
  reasoning: string;
  pageReferences: string[];
}

export class MultiLabelDocumentClassifier {
  
  /**
   * Classify document into specific legal document types with evidence
   */
  static classifyDocument(fileName: string, content: string, pageCount: number = 1): MultiLabelClassificationResult {
    console.log(`Multi-label classifier analyzing: ${fileName}`);
    console.log(`Content length: ${content.length} characters`);
    
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;
    let documentType: MultiLabelClassificationResult['document_type'] = 'undetermined';
    
    // Extract content chunks for analysis
    const chunks = this.extractContextChunks(content, 20, 400);
    
    // Classification patterns with evidence collection
    const classificationResults = [
      this.checkProposalPatterns(chunks, fileName),
      this.checkNTAPatterns(chunks, fileName),
      this.checkMotionPatterns(chunks, fileName),
      this.checkIJDecisionPatterns(chunks, fileName),
      this.checkFormPatterns(chunks, fileName),
      this.checkCountryReportPatterns(chunks, fileName),
      this.checkAdministrativePatterns(chunks, fileName),
      this.checkOtherPatterns(chunks, fileName)
    ];
    
    // Find the highest confidence classification
    let maxConfidence = 0;
    let bestResult = null;
    
    for (const result of classificationResults) {
      if (result.confidence > maxConfidence) {
        maxConfidence = result.confidence;
        bestResult = result;
      }
    }
    
    if (bestResult && bestResult.confidence >= 0.60) {
      documentType = bestResult.type;
      confidence = bestResult.confidence;
      evidence.push(...bestResult.evidence);
      pageReferences.push(...bestResult.pageReferences);
    } else {
      // Enhanced fallback analysis when content extraction fails
      const filenameAnalysis = this.analyzeFilenameForType(fileName);
      
      if (filenameAnalysis.confidence >= 0.65) {
        documentType = filenameAnalysis.type;
        confidence = filenameAnalysis.confidence;
        evidence.push(...filenameAnalysis.evidence);
      } else {
        documentType = 'undetermined';
        confidence = Math.max(0.50, filenameAnalysis.confidence); // Minimum 50% for any legal document
        evidence.push('Content extraction failed - classification based on filename patterns');
        if (filenameAnalysis.evidence.length > 0) {
          evidence.push(...filenameAnalysis.evidence);
        }
      }
    }
    
    const reasoning = this.generateReasoning(documentType, confidence, evidence);
    
    console.log(`Multi-label classification result for ${fileName}:`);
    console.log(`  Type: ${documentType}`);
    console.log(`  Confidence: ${confidence.toFixed(2)}`);
    console.log(`  Evidence count: ${evidence.length}`);
    
    return {
      document_type: documentType,
      confidence,
      evidence,
      reasoning,
      pageReferences
    };
  }
  
  /**
   * Check for proposal patterns with evidence
   */
  private static checkProposalPatterns(chunks: string[], fileName: string): {
    type: 'proposal';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;
    
    const proposalPatterns = [
      { pattern: /grant applications?\s+(?:will be|are|must be)\s+(?:accepted|received|submitted)/i, weight: 0.25, description: "grant application submission requirement" },
      { pattern: /\$[\d,]+(?:-\$[\d,]+)?\s+grants?/i, weight: 0.25, description: "specific grant funding amount" },
      { pattern: /(?:requesting|request(?:s|ed)?)\s+(?:\$[\d,]+|funding)/i, weight: 0.25, description: "funding request language" },
      { pattern: /application(?:s)?\s+(?:due|deadline)\s+(?:by|on)/i, weight: 0.20, description: "application deadline" },
      { pattern: /budget\s+(?:request|ask|proposal)/i, weight: 0.15, description: "budget request" },
      { pattern: /scope\s+of\s+work/i, weight: 0.15, description: "scope of work" },
      { pattern: /deliverables?/i, weight: 0.10, description: "project deliverables" },
      { pattern: /implementation\s+(?:plan|timeline)/i, weight: 0.10, description: "implementation planning" },
      { pattern: /grant\s+(?:program|opportunity|initiative|funding)/i, weight: 0.20, description: "grant program language" },
      { pattern: /funding\s+(?:opportunity|available|announcement)/i, weight: 0.20, description: "funding opportunity announcement" },
      { pattern: /eligib(?:le|ility)\s+(?:applicants?|organizations?)/i, weight: 0.15, description: "eligibility criteria" },
      { pattern: /proposals?\s+(?:must|should|will)\s+(?:include|contain|address)/i, weight: 0.15, description: "proposal requirements" }
    ];
    
    // Filename boost for proposals
    if (/proposal|grant|funding|application|rfp/i.test(fileName)) {
      confidence += 0.10;
      evidence.push(`Filename suggests proposal: "${fileName}"`);
    }
    
    for (const chunk of chunks) {
      for (const { pattern, weight, description } of proposalPatterns) {
        const matches = chunk.match(pattern);
        if (matches) {
          confidence += weight;
          evidence.push(`${description}: "${matches[0]}"`);
          pageReferences.push(`[p 1]`); // Add page reference logic if available
          break; // Only count once per chunk
        }
      }
    }
    
    return {
      type: 'proposal',
      confidence: Math.min(confidence, 0.95),
      evidence,
      pageReferences
    };
  }
  
  /**
   * Check for Notice to Appear (NTA) patterns
   */
  private static checkNTAPatterns(chunks: string[], fileName: string): {
    type: 'nta';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;
    
    const ntaPatterns = [
      { pattern: /Notice\s+to\s+Appear/i, weight: 0.40, description: "Notice to Appear title" },
      { pattern: /Form\s+I-?862/i, weight: 0.35, description: "Form I-862 identifier" },
      { pattern: /form_i-?862/i, weight: 0.35, description: "Form I-862 in filename" },
      { pattern: /notice_to_appear/i, weight: 0.30, description: "Notice to Appear in filename" },
      { pattern: /charging\s+document/i, weight: 0.25, description: "charging document reference" },
      { pattern: /removal\s+proceedings/i, weight: 0.20, description: "removal proceedings language" },
      { pattern: /Immigration\s+Court/i, weight: 0.15, description: "Immigration Court reference" },
      { pattern: /respondent\s+is\s+an\s+alien/i, weight: 0.20, description: "respondent alien language" },
      { pattern: /charges?\s+(?:that|the\s+respondent)/i, weight: 0.15, description: "charges language" },
      { pattern: /Department\s+of\s+Homeland\s+Security/i, weight: 0.15, description: "DHS reference" },
      { pattern: /U\.?S\.?\s+Immigration\s+and\s+Customs\s+Enforcement/i, weight: 0.15, description: "ICE reference" },
      { pattern: /alien\s+registration\s+number/i, weight: 0.15, description: "A-number reference" }
    ];
    
    // Filename boost for NTA - enhanced patterns
    if (/nta|notice.*appear|i-?862|form_i-?862/i.test(fileName)) {
      confidence += 0.20;
      evidence.push(`Filename indicates NTA document: "${fileName}"`);
    }
    
    // Check filename first for NTA patterns
    const fileNameLower = fileName.toLowerCase();
    for (const { pattern, weight, description } of ntaPatterns) {
      if (pattern.test(fileNameLower)) {
        confidence += weight;
        evidence.push(`${description}: "${fileName}"`);
        pageReferences.push(`[filename]`);
      }
    }
    
    // Then check content chunks
    for (const chunk of chunks) {
      for (const { pattern, weight, description } of ntaPatterns) {
        const matches = chunk.match(pattern);
        if (matches) {
          confidence += weight;
          evidence.push(`${description}: "${matches[0]}"`);
          pageReferences.push(`[p 1]`);
          break;
        }
      }
    }
    
    return {
      type: 'nta',
      confidence: Math.min(confidence, 0.95),
      evidence,
      pageReferences
    };
  }
  
  /**
   * Check for motion patterns
   */
  private static checkMotionPatterns(chunks: string[], fileName: string): {
    type: 'motion';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;
    
    const motionPatterns = [
      { pattern: /Motion\s+(?:to|for)/i, weight: 0.30, description: "motion heading" },
      { pattern: /memorandum\s+of\s+law/i, weight: 0.25, description: "memorandum of law" },
      { pattern: /brief\s+in\s+support/i, weight: 0.20, description: "brief in support" },
      { pattern: /respectfully\s+(?:moves|requests)/i, weight: 0.15, description: "respectfully moves language" },
      { pattern: /relief\s+(?:requested|sought)/i, weight: 0.15, description: "relief requested" },
      { pattern: /legal\s+standard/i, weight: 0.10, description: "legal standard reference" },
      { pattern: /argument\s+(?:and\s+)?analysis/i, weight: 0.10, description: "argument and analysis section" },
      { pattern: /motion.*(?:reopen|reconsider)/i, weight: 0.35, description: "motion to reopen/reconsider" },
      { pattern: /reopen.*proceedings/i, weight: 0.20, description: "reopen proceedings language" },
      { pattern: /reconsider.*decision/i, weight: 0.20, description: "reconsider decision language" }
    ];
    
    // Enhanced filename boost for motions - check both filename patterns and specific motion types
    const fileNameLower = fileName.toLowerCase();
    if (/motion/i.test(fileName)) {
      confidence += 0.40; // Strong boost for "motion" in filename
      evidence.push(`Filename clearly indicates motion document: "${fileName}"`);
      
      // Additional boost for specific motion types
      if (/reopen/i.test(fileName)) {
        confidence += 0.20;
        evidence.push(`Motion to reopen identified in filename`);
      }
      if (/reconsider/i.test(fileName)) {
        confidence += 0.20;
        evidence.push(`Motion to reconsider identified in filename`);
      }
    } else if (/brief|memorandum|memo/i.test(fileName)) {
      confidence += 0.20;
      evidence.push(`Filename suggests legal brief/memorandum: "${fileName}"`);
    }
    
    // Check filename for motion patterns first
    for (const { pattern, weight, description } of motionPatterns) {
      if (pattern.test(fileNameLower)) {
        confidence += weight;
        evidence.push(`${description}: detected in filename "${fileName}"`);
        pageReferences.push(`[filename]`);
      }
    }
    
    for (const chunk of chunks) {
      for (const { pattern, weight, description } of motionPatterns) {
        const matches = chunk.match(pattern);
        if (matches) {
          confidence += weight;
          evidence.push(`${description}: "${matches[0]}"`);
          pageReferences.push(`[p 1]`);
          break;
        }
      }
    }
    
    return {
      type: 'motion',
      confidence: Math.min(confidence, 0.95),
      evidence,
      pageReferences
    };
  }
  
  /**
   * Check for immigration judge decision patterns
   */
  private static checkIJDecisionPatterns(chunks: string[], fileName: string): {
    type: 'ij_decision';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;
    
    const ijPatterns = [
      { pattern: /Immigration\s+Judge/i, weight: 0.30, description: "Immigration Judge reference" },
      { pattern: /Board\s+of\s+Immigration\s+Appeals/i, weight: 0.30, description: "BIA reference" },
      { pattern: /(?:OPINION|DECISION|ORDER)\s+(?:AND|&)\s+ORDER/i, weight: 0.25, description: "opinion and order" },
      { pattern: /(?:granted|denied|sustained|overruled)/i, weight: 0.15, description: "decision language" },
      { pattern: /removal\s+(?:granted|denied|terminated)/i, weight: 0.20, description: "removal decision" },
      { pattern: /asylum\s+(?:granted|denied)/i, weight: 0.20, description: "asylum decision" },
      { pattern: /respondent\s+(?:is|has)\s+(?:ordered|found)/i, weight: 0.15, description: "respondent finding" }
    ];
    
    // Filename boost for decisions
    if (/decision|opinion|order|ruling/i.test(fileName)) {
      confidence += 0.10;
      evidence.push(`Filename suggests decision: "${fileName}"`);
    }
    
    for (const chunk of chunks) {
      for (const { pattern, weight, description } of ijPatterns) {
        const matches = chunk.match(pattern);
        if (matches) {
          confidence += weight;
          evidence.push(`${description}: "${matches[0]}"`);
          pageReferences.push(`[p 1]`);
          break;
        }
      }
    }
    
    return {
      type: 'ij_decision',
      confidence: Math.min(confidence, 0.95),
      evidence,
      pageReferences
    };
  }
  
  /**
   * Check for immigration form patterns
   */
  private static checkFormPatterns(chunks: string[], fileName: string): {
    type: 'form';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;
    
    const formPatterns = [
      { pattern: /Form\s+I-\d{3}/i, weight: 0.35, description: "immigration form identifier" },
      { pattern: /(?:Application|Petition)\s+for/i, weight: 0.20, description: "application/petition language" },
      { pattern: /Part\s+\d+\.\s+Information/i, weight: 0.15, description: "form section structure" },
      { pattern: /instructions\s+for\s+form/i, weight: 0.15, description: "form instructions" },
      { pattern: /intake\s+questionnaire/i, weight: 0.20, description: "intake questionnaire" },
      { pattern: /client\s+information/i, weight: 0.10, description: "client information section" }
    ];
    
    // Filename boost for forms
    if (/form|i-?\d{3}|application|petition|intake/i.test(fileName)) {
      confidence += 0.15;
      evidence.push(`Filename suggests form: "${fileName}"`);
    }
    
    for (const chunk of chunks) {
      for (const { pattern, weight, description } of formPatterns) {
        const matches = chunk.match(pattern);
        if (matches) {
          confidence += weight;
          evidence.push(`${description}: "${matches[0]}"`);
          pageReferences.push(`[p 1]`);
          break;
        }
      }
    }
    
    return {
      type: 'form',
      confidence: Math.min(confidence, 0.95),
      evidence,
      pageReferences
    };
  }
  
  /**
   * Check for country report patterns
   */
  private static checkCountryReportPatterns(chunks: string[], fileName: string): {
    type: 'country_report';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;
    
    const countryPatterns = [
      { pattern: /country\s+(?:condition|report|information)/i, weight: 0.30, description: "country condition reference" },
      { pattern: /human\s+rights\s+(?:report|violations)/i, weight: 0.25, description: "human rights report" },
      { pattern: /State\s+Department\s+Report/i, weight: 0.25, description: "State Department report" },
      { pattern: /persecution\s+(?:of|in)/i, weight: 0.20, description: "persecution reference" },
      { pattern: /political\s+conditions/i, weight: 0.15, description: "political conditions" },
      { pattern: /security\s+situation/i, weight: 0.15, description: "security situation" }
    ];
    
    // Filename boost for country reports
    if (/country|report|condition|human.*rights/i.test(fileName)) {
      confidence += 0.12;
      evidence.push(`Filename suggests country report: "${fileName}"`);
    }
    
    for (const chunk of chunks) {
      for (const { pattern, weight, description } of countryPatterns) {
        const matches = chunk.match(pattern);
        if (matches) {
          confidence += weight;
          evidence.push(`${description}: "${matches[0]}"`);
          pageReferences.push(`[p 1]`);
          break;
        }
      }
    }
    
    return {
      type: 'country_report',
      confidence: Math.min(confidence, 0.95),
      evidence,
      pageReferences
    };
  }
  
  /**
   * Check for administrative document patterns
   */
  private static checkAdministrativePatterns(chunks: string[], fileName: string): {
    type: 'administrative';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;
    
    const adminPatterns = [
      { pattern: /immigration\s+law\s+clinic/i, weight: 0.25, description: "immigration law clinic reference" },
      { pattern: /legal\s+services\s+provision/i, weight: 0.20, description: "legal services provision" },
      { pattern: /organizational\s+(?:operations|procedures)/i, weight: 0.20, description: "organizational operations" },
      { pattern: /administrative\s+(?:document|procedures)/i, weight: 0.20, description: "administrative procedures" },
      { pattern: /clinic\s+establishment/i, weight: 0.20, description: "clinic establishment" },
      { pattern: /stakeholders?\s+include/i, weight: 0.15, description: "stakeholder analysis" },
      { pattern: /immigrant\s+communities/i, weight: 0.15, description: "immigrant communities" },
      { pattern: /review\s+processes/i, weight: 0.12, description: "review processes" },
      { pattern: /assessment\s+procedures/i, weight: 0.12, description: "assessment procedures" },
      { pattern: /service\s+delivery/i, weight: 0.10, description: "service delivery" }
    ];
    
    // Filename boost for administrative documents - numeric patterns often administrative
    if (/^\d+\.pdf$/i.test(fileName)) {
      confidence += 0.25;
      evidence.push(`Numeric filename pattern suggests administrative document: "${fileName}"`);
    }
    
    // Check for administrative patterns in content
    for (const chunk of chunks.slice(0, 15)) { // Check first 15 chunks
      for (const { pattern, weight, description } of adminPatterns) {
        const matches = chunk.match(pattern);
        if (matches) {
          confidence += weight;
          evidence.push(`${description}: "${matches[0]}"`);
          pageReferences.push(`[p 1]`);
          break;
        }
      }
    }
    
    return {
      type: 'administrative',
      confidence: Math.min(confidence, 0.85),
      evidence,
      pageReferences
    };
  }
  
  /**
   * Check for other document patterns
   */
  private static checkOtherPatterns(chunks: string[], fileName: string): {
    type: 'other';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;
    
    const otherPatterns = [
      { pattern: /memorandum\s+(?:to|from)/i, weight: 0.15, description: "memorandum format" },
      { pattern: /letter\s+(?:to|from)/i, weight: 0.12, description: "letter format" },
      { pattern: /email\s+(?:to|from)/i, weight: 0.10, description: "email format" },
      { pattern: /correspondence/i, weight: 0.10, description: "correspondence reference" }
    ];
    
    for (const chunk of chunks) {
      for (const { pattern, weight, description } of otherPatterns) {
        const matches = chunk.match(pattern);
        if (matches) {
          confidence += weight;
          evidence.push(`${description}: "${matches[0]}"`);
          pageReferences.push(`[p 1]`);
          break;
        }
      }
    }
    
    // Default confidence for other
    confidence = Math.max(confidence, 0.30);
    
    return {
      type: 'other',
      confidence: Math.min(confidence, 0.95),
      evidence,
      pageReferences
    };
  }
  
  /**
   * Extract content chunks for analysis
   */
  private static extractContextChunks(content: string, maxChunks: number = 20, maxCharsPerChunk: number = 400): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxCharsPerChunk) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '. ';
      }
      
      if (chunks.length >= maxChunks) break;
    }
    
    if (currentChunk.trim() && chunks.length < maxChunks) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
  
  /**
   * Analyze filename for document type when content extraction fails
   */
  private static analyzeFilenameForType(fileName: string): {
    type: MultiLabelClassificationResult['document_type'];
    confidence: number;
    evidence: string[];
  } {
    const lower = fileName.toLowerCase();
    const evidence: string[] = [];
    
    // Strong filename indicators
    if (lower.includes('nta') || lower.includes('notice to appear')) {
      return {
        type: 'nta',
        confidence: 0.85,
        evidence: [`Filename indicates Notice to Appear document: "${fileName}"`]
      };
    }
    
    if (lower.includes('motion') || lower.includes('brief')) {
      return {
        type: 'motion',
        confidence: 0.80,
        evidence: [`Filename indicates legal motion/brief: "${fileName}"`]
      };
    }
    
    if (lower.includes('proposal') || lower.includes('grant') || lower.includes('rfp')) {
      return {
        type: 'proposal',
        confidence: 0.75,
        evidence: [`Filename indicates proposal document: "${fileName}"`]
      };
    }
    
    if (lower.includes('decision') || lower.includes('order') || lower.includes('ruling')) {
      return {
        type: 'ij_decision',
        confidence: 0.75,
        evidence: [`Filename indicates judicial decision: "${fileName}"`]
      };
    }
    
    if (lower.includes('form') || /\b[a-z]-\d+/.test(lower)) {
      return {
        type: 'form',
        confidence: 0.70,
        evidence: [`Filename indicates legal form: "${fileName}"`]
      };
    }
    
    if (lower.includes('country') && lower.includes('report')) {
      return {
        type: 'country_report',
        confidence: 0.75,
        evidence: [`Filename indicates country report: "${fileName}"`]
      };
    }
    
    // Administrative documents - often numeric filenames for internal operations
    if (/^\d+\.pdf$/i.test(fileName)) {
      return {
        type: 'administrative',
        confidence: 0.70,
        evidence: [`Numeric filename pattern suggests administrative document: "${fileName}"`]
      };
    }
    
    // Numeric filename patterns often indicate case documents or legal filings
    if (/^\d+\.pdf$/i.test(fileName)) {
      evidence.push(`Numeric filename pattern suggests legal document: "${fileName}"`);
      return {
        type: 'other',
        confidence: 0.65,
        evidence
      };
    }
    
    // General legal document indicators
    if (lower.includes('legal') || lower.includes('law') || lower.includes('court')) {
      evidence.push(`Filename contains legal terminology: "${fileName}"`);
      return {
        type: 'other',
        confidence: 0.60,
        evidence
      };
    }
    
    return {
      type: 'undetermined',
      confidence: 0.50,
      evidence: [`General document analysis: "${fileName}"`]
    };
  }

  /**
   * Generate human-readable reasoning
   */
  private static generateReasoning(documentType: string, confidence: number, evidence: string[]): string {
    const confidencePercent = Math.round(confidence * 100);
    
    switch (documentType) {
      case 'proposal':
        return `Document classified as funding proposal based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'nta':
        return `Document classified as Notice to Appear (NTA) based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'motion':
        return `Document classified as legal motion/brief based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'ij_decision':
        return `Document classified as immigration judge decision based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'form':
        return `Document classified as immigration form based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'country_report':
        return `Document classified as country conditions report based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'other':
        return `Document classified as other legal document based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      default:
        return `Document classification undetermined. Insufficient evidence for confident classification. Confidence: ${confidencePercent}%`;
    }
  }
}