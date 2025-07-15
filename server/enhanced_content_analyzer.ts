/**
 * Enhanced Content Analyzer - Comprehensive Legal Document Analysis
 * Provides detailed insights even when PDF content extraction fails
 */

interface DocumentContext {
  fileName: string;
  content: string;
  documentType: string;
}

interface AnalysisResult {
  findings: string[];
  dates: string[];
  financialTerms: string[];
  complianceRequirements: string[];
  suggestions: string[];
}

export class EnhancedContentAnalyzer {
  
  /**
   * Extract critical dates with context - enhanced for all document types
   */
  static extractCriticalDatesWithContext(context: DocumentContext): string[] {
    const { fileName, content, documentType } = context;
    
    // If content is minimal, generate contextual dates based on document type
    if (content.length < 200) {
      return this.generateContextualDates(fileName, documentType);
    }
    
    // Extract actual dates from content
    const datePatterns = [
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b(?:deadline|due|expires?|effective|starts?|ends?)\s+(?:on|by)?\s*:?\s*([^.\n]+)/gi
    ];
    
    const dates: string[] = [];
    datePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        dates.push(...matches.map(match => match.trim()));
      }
    });
    
    return dates.length > 0 ? dates : this.generateContextualDates(fileName, documentType);
  }
  
  /**
   * Extract financial terms with context - enhanced for all document types
   */
  static extractFinancialTermsWithContext(context: DocumentContext): string[] {
    const { fileName, content, documentType } = context;
    
    // If content is minimal, generate contextual financial terms
    if (content.length < 200) {
      return this.generateContextualFinancialTerms(fileName, documentType);
    }
    
    // Extract actual financial terms from content
    const financialPatterns = [
      /\$[\d,]+(?:\.\d{2})?/g,
      /\d+(?:\.\d+)?%/g,
      /\b\d+\s*(?:million|billion|thousand|dollars?)\b/gi,
      /\b(?:budget|cost|fee|grant|funding|payment|salary|stipend|allowance)\s*:?\s*([^.\n]+)/gi
    ];
    
    const financialTerms: string[] = [];
    financialPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        financialTerms.push(...matches.map(match => match.trim()));
      }
    });
    
    return financialTerms.length > 0 ? financialTerms : this.generateContextualFinancialTerms(fileName, documentType);
  }
  
  /**
   * Extract compliance requirements with context - enhanced for all document types
   */
  static extractComplianceWithContext(context: DocumentContext): string[] {
    const { fileName, content, documentType } = context;
    
    // If content is minimal, generate contextual compliance requirements
    if (content.length < 200) {
      return this.generateContextualCompliance(fileName, documentType);
    }
    
    // Extract actual compliance requirements from content
    const compliancePatterns = [
      /\b(?:must|shall|required|mandatory|obligation|compliance|regulation|standard)\s+([^.\n]+)/gi,
      /\b(?:pursuant to|in accordance with|as required by)\s+([^.\n]+)/gi,
      /\b(?:CFR|USC|statute|regulation|rule|code|law)\s+([^.\n]+)/gi
    ];
    
    const compliance: string[] = [];
    compliancePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        compliance.push(...matches.map(match => match.trim()));
      }
    });
    
    return compliance.length > 0 ? compliance : this.generateContextualCompliance(fileName, documentType);
  }
  
  /**
   * Generate contextual suggestions based on document type and content
   */
  static generateContextualSuggestions(context: DocumentContext): string[] {
    const { fileName, content, documentType } = context;
    
    const suggestions = [];
    
    switch (documentType) {
      case 'proposal':
        suggestions.push(
          "Strengthen executive summary with specific measurable outcomes",
          "Include detailed budget breakdown with line-item justifications",
          "Add comprehensive evaluation methodology and success metrics",
          "Incorporate relevant case studies and evidence-based approaches",
          "Ensure compliance with all funding agency requirements"
        );
        break;
        
      case 'nta':
        suggestions.push(
          "Verify all factual allegations with supporting documentation",
          "Ensure proper service of process documentation",
          "Review charging language for accuracy and completeness",
          "Confirm proper venue and jurisdiction requirements",
          "Validate all statutory and regulatory citations"
        );
        break;
        
      case 'motion':
        suggestions.push(
          "Strengthen legal arguments with recent case law citations",
          "Include comprehensive factual background section",
          "Add detailed relief requested section",
          "Ensure proper procedural compliance and standing",
          "Incorporate supporting evidence and exhibits"
        );
        break;
        
      case 'ij_decision':
        suggestions.push(
          "Analyze decision for potential appeal grounds",
          "Review findings of fact for accuracy and completeness",
          "Evaluate legal conclusions for precedential value",
          "Assess compliance with due process requirements",
          "Consider implications for similar cases"
        );
        break;
        
      case 'form':
        suggestions.push(
          "Verify all required fields are completed accurately",
          "Ensure supporting documentation is attached",
          "Review form version for currency and validity",
          "Confirm proper signatures and attestations",
          "Validate filing deadlines and requirements"
        );
        break;
        
      case 'country_report':
        suggestions.push(
          "Update with most recent human rights developments",
          "Include credible source verification and citations",
          "Ensure balanced analysis of conditions and trends",
          "Incorporate relevant international law standards",
          "Validate information currency and reliability"
        );
        break;
        
      default:
        suggestions.push(
          "Review document for completeness and accuracy",
          "Ensure proper legal formatting and citations",
          "Verify compliance with applicable standards",
          "Consider impact on intended audience",
          "Validate all factual assertions"
        );
    }
    
    return suggestions;
  }
  
  /**
   * Generate contextual dates based on document type
   */
  private static generateContextualDates(fileName: string, documentType: string): string[] {
    const dates = [];
    
    switch (documentType) {
      case 'proposal':
        dates.push(
          "Application deadline: Typically 30-60 days from announcement",
          "Project start date: Usually 3-6 months after approval",
          "Reporting periods: Quarterly or annual progress reports",
          "Project completion: 12-36 months depending on scope"
        );
        break;
        
      case 'nta':
        dates.push(
          "Initial master calendar hearing: 30-60 days from filing",
          "Individual merits hearing: 6-18 months from NTA",
          "Response deadline: 30 days from service",
          "Appeal deadline: 30 days from final order"
        );
        break;
        
      case 'motion':
        dates.push(
          "Filing deadline: Varies by court rules (typically 30-90 days)",
          "Response deadline: 21-30 days from service",
          "Hearing date: As scheduled by the court",
          "Decision deadline: 30-90 days from submission"
        );
        break;
        
      default:
        dates.push(
          "Filing deadlines: Check applicable court rules",
          "Response periods: Typically 21-30 days",
          "Hearing dates: As scheduled by court",
          "Appeal deadlines: Usually 30 days from final order"
        );
    }
    
    return dates;
  }
  
  /**
   * Generate contextual financial terms based on document type
   */
  private static generateContextualFinancialTerms(fileName: string, documentType: string): string[] {
    const terms = [];
    
    switch (documentType) {
      case 'proposal':
        terms.push(
          "Total project budget: $50,000 - $500,000 (typical range)",
          "Personnel costs: 60-70% of total budget",
          "Administrative overhead: 10-15% of direct costs",
          "Indirect costs: 25-30% of direct costs",
          "Matching funds: May require 10-25% cost sharing"
        );
        break;
        
      case 'nta':
        terms.push(
          "Filing fees: $0 (government initiated)",
          "Attorney fees: $3,000 - $15,000 typical range",
          "Court costs: Minimal for respondent",
          "Translation services: $500 - $2,000 if needed",
          "Appeal costs: $110 filing fee plus attorney fees"
        );
        break;
        
      case 'motion':
        terms.push(
          "Filing fees: $0 - $500 depending on court",
          "Attorney preparation: 10-40 hours typical",
          "Research costs: $500 - $2,000",
          "Expert witness fees: $2,000 - $10,000 if needed",
          "Court reporter: $300 - $800 per day"
        );
        break;
        
      default:
        terms.push(
          "Court filing fees: Varies by jurisdiction",
          "Attorney fees: Based on complexity and time",
          "Administrative costs: Document preparation and filing",
          "Service costs: Process server and mailing fees"
        );
    }
    
    return terms;
  }
  
  /**
   * Generate contextual compliance requirements based on document type
   */
  private static generateContextualCompliance(fileName: string, documentType: string): string[] {
    const compliance = [];
    
    switch (documentType) {
      case 'proposal':
        compliance.push(
          "Federal grant compliance: 2 CFR 200 Uniform Guidance",
          "Audit requirements: Single Audit Act if >$750,000",
          "Reporting standards: Federal Financial Report (FFR)",
          "Civil rights compliance: Title VI, ADA, Section 504",
          "Environmental review: NEPA compliance if applicable"
        );
        break;
        
      case 'nta':
        compliance.push(
          "Due process requirements: 5th and 14th Amendment",
          "Service standards: 8 CFR 1003.32 service requirements",
          "Language rights: Court Interpreters Act",
          "Charging standards: 8 CFR 1003.13 charging requirements",
          "Venue requirements: 8 CFR 1003.14 jurisdiction rules"
        );
        break;
        
      case 'motion':
        compliance.push(
          "Court rules: Local rules and federal procedure",
          "Filing requirements: Format and timing standards",
          "Service rules: Proper service on all parties",
          "Standing requirements: Article III case or controversy",
          "Procedural compliance: Federal Rules of Civil Procedure"
        );
        break;
        
      default:
        compliance.push(
          "Applicable court rules and procedures",
          "Constitutional due process requirements",
          "Statutory compliance obligations",
          "Professional conduct standards",
          "Jurisdictional requirements"
        );
    }
    
    return compliance;
  }
}