/**
 * Multi-Label Document Type Classifier
 * Enhanced classification system for legal documents with granular categorization
 * Based on evidence-based classification with specialized immigration law support
 */

export interface MultiLabelClassificationResult {
  document_type: 'proposal' | 'nta' | 'motion' | 'court_filing' | 'legal_brief' | 'evidence_package' | 'witness_list' | 'cover_letter_uscis' | 'noid' | 'application_i589' | 'affidavit_client' | 'affidavit_expert' | 'psychological_evaluation' | 'country_report' | 'ij_decision' | 'form' | 'administrative' | 'other' | 'undetermined';
  confidence: number;
  evidence: string[];
  reasoning: string;
  pageReferences: string[];
  /** Optional, non-breaking taxonomy label (18-category scheme) */
  taxonomyCategory?: string;
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
    const chunks = this.extractContextChunks(content, 30, 500);
    console.log(`Extracted ${chunks.length} chunks for analysis`);
    console.log(`Sample chunk: ${chunks[0]?.substring(0, 100)}...`);

    // Classification patterns with evidence collection
    const classificationResults = [
      this.checkProposalPatterns(chunks, fileName),
      this.checkNTAPatterns(chunks, fileName),
      this.checkMotionPatterns(chunks, fileName),
      this.checkCourtFilingPatterns(chunks, fileName),
      this.checkLegalBriefPatterns(chunks, fileName),
      this.checkEvidencePackagePatterns(chunks, fileName),
      this.checkWitnessListPatterns(chunks, fileName),
      this.checkCoverLetterUSCISPatterns(chunks, fileName),
      this.checkNOIDPatterns(chunks, fileName),
      this.checkApplicationI589Patterns(chunks, fileName),
      this.checkAffidavitClientPatterns(chunks, fileName),
      this.checkAffidavitExpertPatterns(chunks, fileName),
      this.checkPsychologicalEvaluationPatterns(chunks, fileName),
      this.checkCountryReportPatterns(chunks, fileName),
      this.checkIJDecisionPatterns(chunks, fileName),
      this.checkFormPatterns(chunks, fileName),
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

    if (bestResult && bestResult.confidence >= 0.45) {
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

    // Map to the user's 18-category taxonomy without changing existing APIs
    const taxonomyCategory = this.mapToTaxonomyCategory(
      fileName,
      content,
      documentType
    );

    console.log(`Multi-label classification result for ${fileName}:`);
    console.log(`  Type: ${documentType}`);
    console.log(`  Confidence: ${confidence.toFixed(2)}`);
    console.log(`  Evidence count: ${evidence.length}`);

    return {
      document_type: documentType,
      confidence,
      evidence,
      reasoning,
      pageReferences,
      taxonomyCategory
    };
  }

  /**
   * Map current classification + content to the user's 18-category taxonomy
   * This is additive (non-breaking) and does not alter existing document_type.
   */
  private static mapToTaxonomyCategory(
    fileName: string,
    content: string,
    documentType: MultiLabelClassificationResult['document_type']
  ): string {
    const lower = (content || '').toLowerCase();
    const name = (fileName || '').toLowerCase();

    // 1. Court Filings
    if (
      documentType === 'court_filing' ||
      /(complaint|plaintiff|defendant|certificate of service|proof of service|docket|case\s+number|filed\s+with\s+the\s+court)/i.test(lower)
    ) return 'Court Filings';

    // 2. Blank Legal Forms (check before general forms)
    if ((/blank|template/i.test(name)) ||
      (content.length < 500 && /instructions|part\s+\d+/i.test(lower) && /form/i.test(lower)))
      return 'Blank Legal Forms';

    // 3. Immigration Forms
    if (documentType === 'form' || documentType === 'application_i589' ||
      /(uscis|form\s+i-|application for asylum|immigration form)/i.test(lower))
      return 'Immigration Forms';

    // 4. Notices to Appear (NTA)
    if (documentType === 'nta' || /(notice\s+to\s+appear|form\s+i-?862|master\s+calendar\s+hearing)/i.test(lower))
      return 'Notices to Appear (NTA)';

    // 5. Country Reports / Human Rights Reports
    if (documentType === 'country_report' || /(human\s+rights\s+report|country\s+report|country\s+conditions|unhcr)/i.test(lower))
      return 'Country Reports / Human Rights Reports';

    // 6. Government Reports / Policy Reports
    if (/(investigation|policy\s+report|findings|recommendations|federal|state|municipal|board\s+of\s+aldermen|public\s+meeting)/i.test(lower) ||
      (name.includes('report') && (name.includes('board') || name.includes('council') || name.includes('policy'))))
      return 'Government Reports / Policy Reports';

    // 7. Meeting Minutes / Agendas
    if (/(minutes|meeting|agenda|roll\s+call|adjournment|resolution|city\s+council)/i.test(lower) || name.includes('minutes'))
      return 'Meeting Minutes / Agendas';

    // 8. Legal Clinic / Law School Program Proposals (check before general proposals)
    if ((documentType === 'proposal' && /clinic|law\s+school|legal\s+training|curriculum/i.test(lower)) ||
      (name.includes('clinic') && name.includes('proposal')))
      return 'Legal Clinic / Law School Program Proposals';

    // 9. NGO / Nonprofit Program Proposals (check before general proposals)
    if ((documentType === 'proposal' && /(nonprofit|ngo|community|program|humanitarian|initiative)/i.test(lower)) ||
      (/(nonprofit|ngo)/i.test(lower) && /proposal|grant\s+application/i.test(lower)))
      return 'NGO / Nonprofit Program Proposals';

    // 10. Proposals / Grant Applications
    if (documentType === 'proposal' || /(proposal|grant\s+application|rfp\s+response|funding\s+request)/i.test(lower))
      return 'Proposals / Grant Applications';

    // 11. Requests for Proposals (RFP)
    if (/(request\s+for\s+proposals|\brfp\b)/i.test(lower) || /\brfp\b/i.test(name))
      return 'Requests for Proposals (RFP)';

    // 12. Statements of Work (SOW) / Contracts
    if (/(statement\s+of\s+work|\bsow\b|contract|agreement|payment\s+terms|deliverables)/i.test(lower))
      return 'Statements of Work (SOW) / Contracts';

    // 13. Motions to Reopen / Immigration Motions
    if (documentType === 'motion' || /(motion\s+to\s+reopen|motion\s+to\s+reconsider|respectfully\s+moves)/i.test(lower))
      return 'Motions to Reopen / Immigration Motions';

    // 14. Refugee / Asylum Policy Reports
    if (/(refugee\s+admissions|asylum\s+policy|resettlement\s+plan|refugee\s+cap|admissions\s+report)/i.test(lower) ||
      name.includes('refugee') || name.includes('asylum'))
      return 'Refugee / Asylum Policy Reports';

    // 15. Evidence / Exhibits
    if (documentType === 'evidence_package' || /(exhibit\s+[a-z0-9]|evidence\s+package|attachments?\s+[a-d])/i.test(lower))
      return 'Evidence / Exhibits';

    // 16. Judicial Opinions / Orders
    if (documentType === 'ij_decision' || /(opinion|order\s+and\s+decision|memorandum\s+opinion|signed\s+by\s+judge)/i.test(lower))
      return 'Judicial Opinions / Orders';

    // 17. Legal Guidelines / Compliance Requirements
    if (/(compliance|regulation|requirement|standard|policy|guidelines|shall|must|code)/i.test(lower))
      return 'Legal Guidelines / Compliance Requirements';

    // 18. Other / Unclassified
    return 'Other / Unclassified';
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

    // Enhanced patterns for better content matching
    const countryPatterns = [
      { pattern: /country\s+(?:condition|report|information)/i, weight: 0.35, description: "country condition reference" },
      { pattern: /human\s+rights\s+(?:report|violations|conditions)/i, weight: 0.30, description: "human rights report" },
      { pattern: /State\s+Department\s+Report/i, weight: 0.30, description: "State Department report" },
      { pattern: /persecution\s+(?:of|in|by)/i, weight: 0.25, description: "persecution reference" },
      { pattern: /political\s+(?:conditions|situation|environment)/i, weight: 0.20, description: "political conditions" },
      { pattern: /security\s+(?:situation|conditions)/i, weight: 0.20, description: "security situation" },
      { pattern: /government\s+(?:policies|actions|violations)/i, weight: 0.20, description: "government policies" },
      { pattern: /discrimination\s+(?:against|of|in)/i, weight: 0.20, description: "discrimination reference" },
      { pattern: /violence\s+(?:against|toward|in)/i, weight: 0.20, description: "violence reference" },
      { pattern: /asylum\s+(?:claims|applications|seekers)/i, weight: 0.15, description: "asylum reference" },
      { pattern: /refugee\s+(?:status|protection)/i, weight: 0.15, description: "refugee reference" },
      { pattern: /immigration\s+(?:policies|laws|procedures)/i, weight: 0.15, description: "immigration policies" }
    ];

    // Enhanced filename analysis for country reports
    if (/country|report|condition|human.*rights|japan|nicaragua|mexico|china|india|brazil|russia|iran|venezuela|honduras|guatemala|el\s+salvador/i.test(fileName.toLowerCase())) {
      confidence += 0.25;
      evidence.push(`Filename suggests country report: "${fileName}"`);
    }

    // Check for country names in content
    const countryNames = ['japan', 'nicaragua', 'mexico', 'china', 'india', 'brazil', 'russia', 'iran', 'venezuela', 'honduras', 'guatemala', 'el salvador'];
    const allContent = chunks.join(' ').toLowerCase();
    const foundCountries = countryNames.filter(country =>
      allContent.includes(country.toLowerCase())
    );

    if (foundCountries.length > 0) {
      confidence += 0.20;
      evidence.push(`Country-specific content found: ${foundCountries.join(', ')}`);
    }

    // Enhanced content analysis
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

    // Additional boost for longer content with country report indicators
    if (allContent.length > 5000 && confidence > 0.3) {
      confidence += 0.15;
      evidence.push("Extended content with country report indicators");
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
   * Check for court filing patterns (cover page, certificate of service, etc.)
   */
  private static checkCourtFilingPatterns(chunks: string[], fileName: string): {
    type: 'court_filing';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;

    const courtFilingPatterns = [
      { pattern: /cover\s+page/i, weight: 0.25, description: "cover page indicator" },
      { pattern: /certificate\s+of\s+service/i, weight: 0.25, description: "certificate of service" },
      { pattern: /proof\s+of\s+service/i, weight: 0.20, description: "proof of service" },
      { pattern: /civil\s+cover\s+sheet/i, weight: 0.30, description: "civil cover sheet" },
      { pattern: /notice\s+of\s+filing/i, weight: 0.20, description: "notice of filing" },
      { pattern: /docket\s+entry/i, weight: 0.15, description: "docket entry" },
      { pattern: /filed\s+with\s+the\s+court/i, weight: 0.20, description: "court filing language" }
    ];

    for (const chunk of chunks) {
      for (const { pattern, weight, description } of courtFilingPatterns) {
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
      type: 'court_filing',
      confidence: Math.min(confidence, 0.90),
      evidence,
      pageReferences
    };
  }

  /**
   * Check for legal brief patterns
   */
  private static checkLegalBriefPatterns(chunks: string[], fileName: string): {
    type: 'legal_brief';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;

    const legalBriefPatterns = [
      { pattern: /brief\s+(?:of|for|in\s+support)/i, weight: 0.30, description: "brief title" },
      { pattern: /memorandum\s+of\s+(?:law|points\s+and\s+authorities)/i, weight: 0.35, description: "memorandum of law" },
      { pattern: /argument\s+(?:i|ii|iii|iv|v)/i, weight: 0.20, description: "legal argument structure" },
      { pattern: /standard\s+of\s+review/i, weight: 0.15, description: "legal standard" },
      { pattern: /conclusion\s+of\s+law/i, weight: 0.15, description: "conclusion of law" },
      { pattern: /table\s+of\s+contents/i, weight: 0.10, description: "brief structure" },
      { pattern: /counsel\s+of\s+record/i, weight: 0.15, description: "counsel identification" }
    ];

    for (const chunk of chunks) {
      for (const { pattern, weight, description } of legalBriefPatterns) {
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
      type: 'legal_brief',
      confidence: Math.min(confidence, 0.95),
      evidence,
      pageReferences
    };
  }

  /**
   * Check for evidence package patterns
   */
  private static checkEvidencePackagePatterns(chunks: string[], fileName: string): {
    type: 'evidence_package';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;

    const evidencePackagePatterns = [
      { pattern: /evidence\s+(?:package|submitted|filed)/i, weight: 0.30, description: "evidence package indicator" },
      { pattern: /exhibit\s+[a-z0-9]/i, weight: 0.25, description: "exhibit designation" },
      { pattern: /supporting\s+(?:documentation|evidence)/i, weight: 0.20, description: "supporting evidence" },
      { pattern: /attachments?\s+(?:a|b|c|d)/i, weight: 0.20, description: "attachment designation" },
      { pattern: /index\s+of\s+exhibits/i, weight: 0.25, description: "exhibit index" },
      { pattern: /evidence\s+list/i, weight: 0.20, description: "evidence list" }
    ];

    for (const chunk of chunks) {
      for (const { pattern, weight, description } of evidencePackagePatterns) {
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
      type: 'evidence_package',
      confidence: Math.min(confidence, 0.90),
      evidence,
      pageReferences
    };
  }

  /**
   * Check for witness list patterns
   */
  private static checkWitnessListPatterns(chunks: string[], fileName: string): {
    type: 'witness_list';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;

    const witnessListPatterns = [
      { pattern: /witness\s+list/i, weight: 0.40, description: "witness list title" },
      { pattern: /list\s+of\s+witnesses/i, weight: 0.35, description: "list of witnesses" },
      { pattern: /witness\s+(?:name|address|phone)/i, weight: 0.20, description: "witness information" },
      { pattern: /expert\s+witness/i, weight: 0.25, description: "expert witness" },
      { pattern: /lay\s+witness/i, weight: 0.20, description: "lay witness" },
      { pattern: /witness\s+testimony/i, weight: 0.15, description: "witness testimony" }
    ];

    for (const chunk of chunks) {
      for (const { pattern, weight, description } of witnessListPatterns) {
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
      type: 'witness_list',
      confidence: Math.min(confidence, 0.90),
      evidence,
      pageReferences
    };
  }

  /**
   * Check for cover letter to USCIS patterns
   */
  private static checkCoverLetterUSCISPatterns(chunks: string[], fileName: string): {
    type: 'cover_letter_uscis';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;

    const coverLetterUSCISPatterns = [
      { pattern: /cover\s+letter/i, weight: 0.25, description: "cover letter indicator" },
      { pattern: /uscis\s+(?:service\s+center|office)/i, weight: 0.30, description: "USCIS reference" },
      { pattern: /u\.?s\.?\s+citizenship\s+and\s+immigration\s+services/i, weight: 0.35, description: "USCIS full name" },
      { pattern: /dear\s+(?:sir|madam|director)/i, weight: 0.15, description: "formal letter opening" },
      { pattern: /enclosed\s+(?:please\s+find|is)/i, weight: 0.20, description: "enclosure language" },
      { pattern: /respectfully\s+submitted/i, weight: 0.15, description: "formal submission" }
    ];

    for (const chunk of chunks) {
      for (const { pattern, weight, description } of coverLetterUSCISPatterns) {
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
      type: 'cover_letter_uscis',
      confidence: Math.min(confidence, 0.90),
      evidence,
      pageReferences
    };
  }

  /**
   * Check for Notice of Intent to Deny (NOID) patterns
   */
  private static checkNOIDPatterns(chunks: string[], fileName: string): {
    type: 'noid';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;

    const noidPatterns = [
      { pattern: /notice\s+of\s+intent\s+to\s+deny/i, weight: 0.50, description: "NOID title" },
      { pattern: /noid/i, weight: 0.40, description: "NOID abbreviation" },
      { pattern: /intent\s+to\s+deny/i, weight: 0.35, description: "intent to deny language" },
      { pattern: /you\s+have\s+\d+\s+days\s+to\s+respond/i, weight: 0.25, description: "response deadline" },
      { pattern: /failure\s+to\s+respond\s+will\s+result\s+in\s+denial/i, weight: 0.30, description: "denial warning" },
      { pattern: /evidence\s+to\s+overcome\s+this\s+notice/i, weight: 0.20, description: "evidence requirement" }
    ];

    for (const chunk of chunks) {
      for (const { pattern, weight, description } of noidPatterns) {
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
      type: 'noid',
      confidence: Math.min(confidence, 0.95),
      evidence,
      pageReferences
    };
  }

  /**
   * Check for I-589 Application patterns
   */
  private static checkApplicationI589Patterns(chunks: string[], fileName: string): {
    type: 'application_i589';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;

    const i589Patterns = [
      { pattern: /form\s+i-?589/i, weight: 0.50, description: "I-589 form reference" },
      { pattern: /application\s+for\s+asylum/i, weight: 0.45, description: "asylum application" },
      { pattern: /and\s+for\s+withholding\s+of\s+removal/i, weight: 0.30, description: "withholding of removal" },
      { pattern: /part\s+[a-z]\s*\.\s*[a-z]/i, weight: 0.20, description: "form parts" },
      { pattern: /alien\s+registration\s+number/i, weight: 0.25, description: "A-number reference" },
      { pattern: /country\s+of\s+nationality/i, weight: 0.20, description: "nationality information" },
      { pattern: /fear\s+of\s+persecution/i, weight: 0.25, description: "persecution claim" }
    ];

    for (const chunk of chunks) {
      for (const { pattern, weight, description } of i589Patterns) {
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
      type: 'application_i589',
      confidence: Math.min(confidence, 0.95),
      evidence,
      pageReferences
    };
  }

  /**
   * Check for client affidavit patterns
   */
  private static checkAffidavitClientPatterns(chunks: string[], fileName: string): {
    type: 'affidavit_client';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;

    const clientAffidavitPatterns = [
      { pattern: /affidavit\s+of\s+[a-z\s]+/i, weight: 0.30, description: "affidavit of person" },
      { pattern: /i,\s+[a-z\s]+,\s+being\s+duly\s+sworn/i, weight: 0.35, description: "sworn statement" },
      { pattern: /depose\s+and\s+say/i, weight: 0.25, description: "deposition language" },
      { pattern: /personal\s+knowledge/i, weight: 0.20, description: "personal knowledge" },
      { pattern: /under\s+penalty\s+of\s+perjury/i, weight: 0.30, description: "perjury penalty" },
      { pattern: /executed\s+on\s+[a-z]+\s+\d+/i, weight: 0.15, description: "execution date" },
      { pattern: /notary\s+public/i, weight: 0.20, description: "notary reference" }
    ];

    for (const chunk of chunks) {
      for (const { pattern, weight, description } of clientAffidavitPatterns) {
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
      type: 'affidavit_client',
      confidence: Math.min(confidence, 0.90),
      evidence,
      pageReferences
    };
  }

  /**
   * Check for expert affidavit patterns
   */
  private static checkAffidavitExpertPatterns(chunks: string[], fileName: string): {
    type: 'affidavit_expert';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;

    const expertAffidavitPatterns = [
      { pattern: /expert\s+affidavit/i, weight: 0.40, description: "expert affidavit" },
      { pattern: /affidavit\s+of\s+expert/i, weight: 0.35, description: "affidavit of expert" },
      { pattern: /qualifications\s+as\s+expert/i, weight: 0.25, description: "expert qualifications" },
      { pattern: /expertise\s+in/i, weight: 0.20, description: "expertise area" },
      { pattern: /professional\s+opinion/i, weight: 0.25, description: "professional opinion" },
      { pattern: /based\s+on\s+my\s+expertise/i, weight: 0.20, description: "expertise basis" },
      { pattern: /curriculum\s+vitae/i, weight: 0.15, description: "CV reference" }
    ];

    for (const chunk of chunks) {
      for (const { pattern, weight, description } of expertAffidavitPatterns) {
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
      type: 'affidavit_expert',
      confidence: Math.min(confidence, 0.90),
      evidence,
      pageReferences
    };
  }

  /**
   * Check for psychological evaluation patterns
   */
  private static checkPsychologicalEvaluationPatterns(chunks: string[], fileName: string): {
    type: 'psychological_evaluation';
    confidence: number;
    evidence: string[];
    pageReferences: string[];
  } {
    const evidence: string[] = [];
    const pageReferences: string[] = [];
    let confidence = 0.0;

    const psychologicalEvaluationPatterns = [
      { pattern: /psychological\s+evaluation/i, weight: 0.45, description: "psychological evaluation" },
      { pattern: /mental\s+health\s+evaluation/i, weight: 0.40, description: "mental health evaluation" },
      { pattern: /psychiatric\s+evaluation/i, weight: 0.40, description: "psychiatric evaluation" },
      { pattern: /diagnostic\s+impression/i, weight: 0.25, description: "diagnostic impression" },
      { pattern: /dsm-?5/i, weight: 0.20, description: "DSM-5 reference" },
      { pattern: /ptsd|post\s+traumatic\s+stress\s+disorder/i, weight: 0.25, description: "PTSD reference" },
      { pattern: /trauma\s+assessment/i, weight: 0.20, description: "trauma assessment" },
      { pattern: /clinical\s+interview/i, weight: 0.20, description: "clinical interview" },
      { pattern: /mental\s+status\s+examination/i, weight: 0.25, description: "mental status exam" }
    ];

    for (const chunk of chunks) {
      for (const { pattern, weight, description } of psychologicalEvaluationPatterns) {
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
      type: 'psychological_evaluation',
      confidence: Math.min(confidence, 0.95),
      evidence,
      pageReferences
    };
  }

  /**
   * Extract content chunks for analysis
   */
  private static extractContextChunks(content: string, maxChunks: number = 30, maxCharsPerChunk: number = 500): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const chunks: string[] = [];
    let currentChunk = '';

    // Take chunks from beginning, middle, and end for better coverage
    const totalSentences = sentences.length;
    const startIndex = 0;
    const middleIndex = Math.floor(totalSentences / 2);
    const endIndex = Math.max(0, totalSentences - 10);

    // Process beginning sentences
    for (let i = startIndex; i < Math.min(startIndex + 10, totalSentences); i++) {
      const sentence = sentences[i];
      if (currentChunk.length + sentence.length > maxCharsPerChunk) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '. ';
      }
    }

    // Process middle sentences
    currentChunk = '';
    for (let i = middleIndex; i < Math.min(middleIndex + 10, totalSentences); i++) {
      const sentence = sentences[i];
      if (currentChunk.length + sentence.length > maxCharsPerChunk) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '. ';
      }
    }

    // Process end sentences
    currentChunk = '';
    for (let i = endIndex; i < totalSentences; i++) {
      const sentence = sentences[i];
      if (currentChunk.length + sentence.length > maxCharsPerChunk) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '. ';
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // Remove duplicates and limit to maxChunks
    const uniqueChunks = Array.from(new Set(chunks));
    return uniqueChunks.slice(0, maxChunks);
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

    if (lower.includes('noid') || lower.includes('notice of intent to deny')) {
      return {
        type: 'noid',
        confidence: 0.85,
        evidence: [`Filename indicates Notice of Intent to Deny: "${fileName}"`]
      };
    }

    if (lower.includes('i-589') || lower.includes('i589') || lower.includes('asylum application')) {
      return {
        type: 'application_i589',
        confidence: 0.85,
        evidence: [`Filename indicates I-589 Asylum Application: "${fileName}"`]
      };
    }

    if (lower.includes('affidavit') && (lower.includes('expert') || lower.includes('professional'))) {
      return {
        type: 'affidavit_expert',
        confidence: 0.80,
        evidence: [`Filename indicates expert affidavit: "${fileName}"`]
      };
    }

    if (lower.includes('affidavit')) {
      return {
        type: 'affidavit_client',
        confidence: 0.80,
        evidence: [`Filename indicates client affidavit: "${fileName}"`]
      };
    }

    if (lower.includes('psychological') || lower.includes('psychiatric') || lower.includes('mental health')) {
      return {
        type: 'psychological_evaluation',
        confidence: 0.85,
        evidence: [`Filename indicates psychological evaluation: "${fileName}"`]
      };
    }

    if (lower.includes('witness list') || lower.includes('witnesses')) {
      return {
        type: 'witness_list',
        confidence: 0.80,
        evidence: [`Filename indicates witness list: "${fileName}"`]
      };
    }

    if (lower.includes('evidence') && (lower.includes('package') || lower.includes('exhibit'))) {
      return {
        type: 'evidence_package',
        confidence: 0.80,
        evidence: [`Filename indicates evidence package: "${fileName}"`]
      };
    }

    if (lower.includes('cover letter') && lower.includes('uscis')) {
      return {
        type: 'cover_letter_uscis',
        confidence: 0.80,
        evidence: [`Filename indicates USCIS cover letter: "${fileName}"`]
      };
    }

    if (lower.includes('motion') || lower.includes('brief')) {
      return {
        type: 'motion',
        confidence: 0.80,
        evidence: [`Filename indicates legal motion/brief: "${fileName}"`]
      };
    }

    if (lower.includes('legal brief') || lower.includes('memorandum of law')) {
      return {
        type: 'legal_brief',
        confidence: 0.80,
        evidence: [`Filename indicates legal brief: "${fileName}"`]
      };
    }

    if (lower.includes('court filing') || lower.includes('cover page') || lower.includes('certificate of service')) {
      return {
        type: 'court_filing',
        confidence: 0.80,
        evidence: [`Filename indicates court filing: "${fileName}"`]
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
      case 'noid':
        return `Document classified as Notice of Intent to Deny (NOID) based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'application_i589':
        return `Document classified as I-589 Asylum Application based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'affidavit_client':
        return `Document classified as client affidavit based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'affidavit_expert':
        return `Document classified as expert affidavit based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'psychological_evaluation':
        return `Document classified as psychological evaluation based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'witness_list':
        return `Document classified as witness list based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'evidence_package':
        return `Document classified as evidence package based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'cover_letter_uscis':
        return `Document classified as USCIS cover letter based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'motion':
        return `Document classified as legal motion based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'legal_brief':
        return `Document classified as legal brief based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'court_filing':
        return `Document classified as court filing (cover page, certificate of service, etc.) based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'ij_decision':
        return `Document classified as immigration judge decision based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'form':
        return `Document classified as immigration form based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'country_report':
        return `Document classified as country conditions report based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'administrative':
        return `Document classified as administrative document based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      case 'other':
        return `Document classified as other legal document based on ${evidence.length} pieces of evidence. Confidence: ${confidencePercent}%`;
      default:
        return `Document classification undetermined. Insufficient evidence for confident classification. Confidence: ${confidencePercent}%`;
    }
  }
}