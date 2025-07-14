/**
 * Enhanced Legal Proposal Classifier with Evidence-Based Detection
 * Implements improved classification with evidence requirements and better context analysis
 */

export interface ClassificationResult {
  verdict: 'proposal' | 'non-proposal' | 'undetermined';
  confidence: number;
  evidence: string[];
  reasoning: string;
}

export class EnhancedLegalClassifier {
  
  /**
   * Enhanced proposal classification with evidence requirement
   */
  static classifyDocument(fileName: string, fileContent: string): ClassificationResult {
    const content = fileContent.toLowerCase();
    const filename = fileName.toLowerCase();
    
    // Debug logging
    console.log(`Classifying document: ${fileName}`);
    console.log(`Content length: ${fileContent.length} characters`);
    console.log(`Content preview: ${content.substring(0, 200)}...`);
    
    // Enhanced evidence collection
    const evidence: string[] = [];
    let proposalScore = 0;
    let nonProposalScore = 0;
    
    // Strong positive indicators with evidence
    const strongPositivePatterns = [
      { pattern: /grant applications?\s+(?:will be|are|must be)\s+(?:accepted|received|submitted)/i, weight: 3, description: "grant application submission requirement" },
      { pattern: /\$[\d,]+(?:-\$[\d,]+)?\s+grants?/i, weight: 3, description: "specific grant funding amount" },
      { pattern: /(?:requesting|request(?:s|ed)?)\s+(?:\$[\d,]+|funding)/i, weight: 3, description: "funding request language" },
      { pattern: /application(?:s)?\s+(?:due|deadline)\s+(?:by|on)/i, weight: 3, description: "application deadline" },
      { pattern: /budget\s+(?:request|ask|proposal)/i, weight: 2, description: "budget request" },
      { pattern: /scope\s+of\s+work/i, weight: 2, description: "scope of work" },
      { pattern: /deliverables?/i, weight: 2, description: "project deliverables" },
      { pattern: /implementation\s+(?:plan|timeline)/i, weight: 2, description: "implementation planning" },
      // Additional grant-specific patterns
      { pattern: /grant\s+(?:program|opportunity|initiative|funding)/i, weight: 3, description: "grant program language" },
      { pattern: /funding\s+(?:opportunity|available|announcement)/i, weight: 3, description: "funding opportunity announcement" },
      { pattern: /eligib(?:le|ility)\s+(?:applicants?|organizations?)/i, weight: 2, description: "eligibility criteria" },
      { pattern: /application\s+(?:process|requirements?|guidelines?)/i, weight: 2, description: "application process details" },
      { pattern: /awards?\s+(?:will be|are)\s+(?:made|granted)/i, weight: 2, description: "award announcement" },
      { pattern: /proposals?\s+(?:must|should|will)\s+(?:include|contain|address)/i, weight: 2, description: "proposal requirements" },
      { pattern: /clinic\s+(?:grants?|funding|support)/i, weight: 2, description: "clinic funding" },
      { pattern: /legal\s+services?\s+grant/i, weight: 2, description: "legal services grant" }
    ];
    
    // Strong negative indicators
    const strongNegativePatterns = [
      { pattern: /\bv\.\s+/i, weight: 3, description: "legal case format" },
      { pattern: /opinion\s+of\s+the\s+court/i, weight: 3, description: "court opinion" },
      { pattern: /(?:plaintiff|defendant)\s+(?:moves?|filed?|argues?)/i, weight: 3, description: "litigation language" },
      { pattern: /order\s+granting/i, weight: 2, description: "court order" },
      { pattern: /docket\s+(?:number|entry)/i, weight: 2, description: "court docket" },
      { pattern: /motion\s+(?:for|to)/i, weight: 2, description: "legal motion" }
    ];
    
    // Check positive patterns
    for (const { pattern, weight, description } of strongPositivePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        proposalScore += weight;
        evidence.push(`Found ${description}: "${matches[0].trim()}"`);
      }
    }
    
    // Check negative patterns
    for (const { pattern, weight, description } of strongNegativePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        nonProposalScore += weight;
        evidence.push(`Found ${description}: "${matches[0].trim()}"`);
      }
    }
    
    // Filename analysis
    const filenamePositive = /(?:proposal|grant|rfp|funding|application)/i.test(filename);
    const filenameNegative = /(?:opinion|ruling|order|docket|case)/i.test(filename);
    
    if (filenamePositive) {
      proposalScore += 1;
      evidence.push(`Filename indicates proposal: "${fileName}"`);
    }
    
    if (filenameNegative) {
      nonProposalScore += 1;
      evidence.push(`Filename indicates legal document: "${fileName}"`);
    }
    
    // Content structure analysis
    if (content.includes('law clinic') && (content.includes('grant') || content.includes('funding'))) {
      proposalScore += 2;
      evidence.push('Document discusses law clinic funding/grants');
    }
    
    // Additional broad content analysis for grant documents
    if (content.includes('grant') && content.includes('application')) {
      proposalScore += 1;
      evidence.push('Document contains grant application language');
    }
    
    if (content.includes('funding') && (content.includes('available') || content.includes('opportunity'))) {
      proposalScore += 1;
      evidence.push('Document mentions funding availability or opportunity');
    }
    
    if (content.includes('eligib') && content.includes('applic')) {
      proposalScore += 1;
      evidence.push('Document discusses eligibility and application requirements');
    }
    
    // Determine verdict and confidence
    let verdict: 'proposal' | 'non-proposal' | 'undetermined';
    let confidence: number;
    let reasoning: string;
    
    // Lower evidence threshold for better detection
    if (evidence.length < 1) {
      verdict = 'undetermined';
      confidence = 0.0;
      reasoning = 'No clear evidence found for classification';
    } else if (proposalScore > nonProposalScore + 1) {
      verdict = 'proposal';
      confidence = Math.min(0.75 + (proposalScore * 0.05), 0.98);
      reasoning = `Strong proposal indicators (score: ${proposalScore} vs ${nonProposalScore})`;
    } else if (nonProposalScore > proposalScore + 1) {
      verdict = 'non-proposal';
      confidence = Math.min(0.75 + (nonProposalScore * 0.05), 0.98);
      reasoning = `Strong non-proposal indicators (score: ${nonProposalScore} vs ${proposalScore})`;
    } else {
      verdict = 'undetermined';
      confidence = 0.6;
      reasoning = `Mixed indicators (proposal: ${proposalScore}, non-proposal: ${nonProposalScore})`;
    }
    
    // Debug result logging
    console.log(`Classification result for ${fileName}:`);
    console.log(`  Verdict: ${verdict}`);
    console.log(`  Confidence: ${confidence}`);
    console.log(`  Proposal Score: ${proposalScore}`);
    console.log(`  Non-Proposal Score: ${nonProposalScore}`);
    console.log(`  Evidence: ${evidence.join(', ')}`);
    console.log(`  Reasoning: ${reasoning}`);
    
    return {
      verdict,
      confidence,
      evidence,
      reasoning
    };
  }
  
  /**
   * Extract better context chunks for analysis
   */
  static extractContextChunks(content: string, maxChunks: number = 20, maxCharsPerChunk: number = 450): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const chunks: string[] = [];
    
    // Prioritize sentences with key terms
    const priorityTerms = [
      'grant', 'funding', 'application', 'proposal', 'budget', 'request',
      'deadline', 'submission', 'award', 'clinic', 'legal services'
    ];
    
    // Score sentences by priority term density
    const scoredSentences = sentences.map(sentence => {
      const score = priorityTerms.reduce((acc, term) => {
        return acc + (sentence.toLowerCase().includes(term) ? 1 : 0);
      }, 0);
      return { sentence: sentence.trim(), score };
    });
    
    // Sort by score and take top sentences
    scoredSentences.sort((a, b) => b.score - a.score);
    
    let currentChunk = '';
    for (const { sentence } of scoredSentences) {
      if (chunks.length >= maxChunks) break;
      
      if (currentChunk.length + sentence.length > maxCharsPerChunk) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
      }
      
      currentChunk += sentence + '. ';
    }
    
    if (currentChunk.trim() && chunks.length < maxChunks) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
}