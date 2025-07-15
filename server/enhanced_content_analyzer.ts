/**
 * Enhanced Content Analyzer for Legal Documents
 * Extracts specific, contextual information from document content
 */

interface DocumentContext {
  fileName: string;
  content: string;
  documentType?: string;
}

export class EnhancedContentAnalyzer {
  
  /**
   * Extract specific dates with contextual information
   */
  static extractCriticalDatesWithContext(context: DocumentContext): string[] {
    const { fileName, content } = context;
    const dates: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Enhanced date patterns with context capture
    const dateWithContextPattern = /([^.]*?)(\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|\b\d{1,2}\/\d{1,2}\/\d{4}|\b\d{4}-\d{2}-\d{2})([^.]*?\.)/gi;
    
    let match;
    while ((match = dateWithContextPattern.exec(content)) !== null && dates.length < 5) {
      const [fullMatch, beforeDate, dateStr, afterDate] = match;
      const contextPhrase = this.getDateContextPhrase(beforeDate + dateStr + afterDate);
      if (contextPhrase) {
        dates.push(`${contextPhrase}: ${dateStr}`);
      }
    }
    
    // Extract year ranges for reports
    const yearRangePattern = /(\d{4})\s*[-–]\s*(\d{4})/g;
    const yearRanges = content.match(yearRangePattern);
    if (yearRanges && dates.length < 5) {
      yearRanges.slice(0, 2).forEach(range => {
        dates.push(`Report coverage period: ${range}`);
      });
    }
    
    // Extract "as of" dates
    const asOfPattern = /as\s+of\s+([^,.]+(?:\d{4}|20\d{2}))/gi;
    const asOfMatches = content.match(asOfPattern);
    if (asOfMatches && dates.length < 5) {
      asOfMatches.slice(0, 2).forEach(match => {
        dates.push(`Current information: ${match.trim()}`);
      });
    }
    
    return dates;
  }
  
  /**
   * Extract financial information with specific context
   */
  static extractFinancialTermsWithContext(context: DocumentContext): string[] {
    const { fileName, content } = context;
    const terms: string[] = [];
    
    // Enhanced money pattern with context
    const moneyWithContextPattern = /([^.]*?)(\$[\d,]+(?:\.\d{2})?)([^.]*?\.)/gi;
    
    let match;
    while ((match = moneyWithContextPattern.exec(content)) !== null && terms.length < 5) {
      const [fullMatch, beforeAmount, amount, afterAmount] = match;
      const contextPhrase = this.getFinancialContextPhrase(beforeAmount + amount + afterAmount);
      if (contextPhrase) {
        terms.push(`${contextPhrase}: ${amount}`);
      }
    }
    
    // Extract funding ranges
    const fundingRangePattern = /\$[\d,]+(?:\.\d{2})?\s*(?:to|through|-)\s*\$[\d,]+(?:\.\d{2})?/gi;
    const rangeMatches = content.match(fundingRangePattern);
    if (rangeMatches && terms.length < 5) {
      rangeMatches.slice(0, 2).forEach(range => {
        terms.push(`Funding range available: ${range}`);
      });
    }
    
    // Extract percentage allocations
    const percentWithContextPattern = /([^.]*?)(\d+(?:\.\d+)?%)([^.]*?\.)/gi;
    let percentMatch;
    while ((percentMatch = percentWithContextPattern.exec(content)) !== null && terms.length < 5) {
      const [fullMatch, beforePercent, percent, afterPercent] = percentMatch;
      const contextPhrase = this.getPercentageContextPhrase(beforePercent + percent + afterPercent);
      if (contextPhrase) {
        terms.push(`${contextPhrase}: ${percent}`);
      }
    }
    
    return terms;
  }
  
  /**
   * Extract compliance requirements with specifics
   */
  static extractComplianceWithContext(context: DocumentContext): string[] {
    const { fileName, content } = context;
    const requirements: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Extract specific compliance mentions with context
    const compliancePatterns = [
      { keyword: 'human rights', context: 'Human rights monitoring and protection standards' },
      { keyword: 'international law', context: 'International legal framework compliance' },
      { keyword: 'constitutional', context: 'Constitutional law adherence requirements' },
      { keyword: 'due process', context: 'Due process protection and procedural fairness' },
      { keyword: 'persecution', context: 'Persecution documentation and evidence standards' },
      { keyword: 'asylum', context: 'Asylum law compliance and procedural requirements' },
      { keyword: 'state department', context: 'U.S. State Department reporting standards' },
      { keyword: 'un convention', context: 'UN Convention compliance requirements' },
      { keyword: 'geneva convention', context: 'Geneva Convention adherence standards' }
    ];
    
    compliancePatterns.forEach(({ keyword, context: contextDesc }) => {
      if (lowerContent.includes(keyword) && requirements.length < 8) {
        requirements.push(contextDesc);
      }
    });
    
    // Extract specific law citations
    const lawCitationPattern = /\b(?:section|article|chapter)\s+\d+[a-z]?(?:\(\w+\))?/gi;
    const citations = content.match(lawCitationPattern);
    if (citations && requirements.length < 8) {
      const uniqueCitations = [...new Set(citations)].slice(0, 2);
      uniqueCitations.forEach(citation => {
        requirements.push(`Legal citation compliance: ${citation}`);
      });
    }
    
    return requirements;
  }
  
  /**
   * Generate contextual improvement suggestions
   */
  static generateContextualSuggestions(context: DocumentContext): string[] {
    const { fileName, content } = context;
    const suggestions: string[] = [];
    const lowerContent = content.toLowerCase();
    const lowerFileName = fileName.toLowerCase();
    
    // Document-type specific suggestions
    if (lowerFileName.includes('human-rights-report') || lowerContent.includes('human rights')) {
      suggestions.push(
        'Cross-reference with most recent U.S. State Department Country Reports',
        'Verify information currency with UNHCR Country of Origin Information',
        'Compare findings with other international human rights organizations',
        'Assess government protection capability and willingness metrics',
        'Identify specific persecution patterns relevant to asylum cases'
      );
    } else if (lowerFileName.includes('grant') || lowerContent.includes('grant application')) {
      suggestions.push(
        'Strengthen measurable outcomes and performance indicators',
        'Enhance budget justification with detailed cost breakdowns',
        'Develop comprehensive evaluation methodology',
        'Expand community partnerships and collaboration details',
        'Include sustainability planning beyond grant period'
      );
    } else if (lowerContent.includes('immigration') || lowerContent.includes('asylum')) {
      suggestions.push(
        'Update with most recent case law and precedent decisions',
        'Include country-specific evidence and documentation',
        'Strengthen legal argument with supporting case citations',
        'Enhance credibility assessment framework',
        'Develop comprehensive timeline of relevant events'
      );
    } else {
      // Generic legal document suggestions
      suggestions.push(
        'Strengthen legal citations and precedent references',
        'Enhance factual documentation with supporting evidence',
        'Improve procedural compliance verification',
        'Develop comprehensive risk assessment framework',
        'Update with current regulatory requirements'
      );
    }
    
    return suggestions.slice(0, 5);
  }
  
  /**
   * Helper methods for context extraction
   */
  private static getDateContextPhrase(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('report') && lowerText.includes('period')) return 'Report period';
    if (lowerText.includes('election')) return 'Election date';
    if (lowerText.includes('updated') || lowerText.includes('current')) return 'Last updated';
    if (lowerText.includes('since') || lowerText.includes('beginning')) return 'Start date';
    if (lowerText.includes('until') || lowerText.includes('through')) return 'End date';
    if (lowerText.includes('deadline') || lowerText.includes('due')) return 'Deadline';
    if (lowerText.includes('law') || lowerText.includes('legislation')) return 'Legal effective date';
    
    return null;
  }
  
  private static getFinancialContextPhrase(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('grant') || lowerText.includes('award')) return 'Grant funding';
    if (lowerText.includes('budget') || lowerText.includes('allocation')) return 'Budget allocation';
    if (lowerText.includes('salary') || lowerText.includes('compensation')) return 'Personnel costs';
    if (lowerText.includes('overhead') || lowerText.includes('administrative')) return 'Administrative costs';
    if (lowerText.includes('total') || lowerText.includes('amount')) return 'Total amount';
    if (lowerText.includes('annual') || lowerText.includes('yearly')) return 'Annual funding';
    
    return null;
  }
  
  private static getPercentageContextPhrase(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('budget') || lowerText.includes('allocation')) return 'Budget percentage';
    if (lowerText.includes('overhead') || lowerText.includes('indirect')) return 'Overhead rate';
    if (lowerText.includes('matching') || lowerText.includes('cost sharing')) return 'Cost sharing rate';
    if (lowerText.includes('success') || lowerText.includes('completion')) return 'Success rate';
    if (lowerText.includes('approval') || lowerText.includes('acceptance')) return 'Approval rate';
    
    return null;
  }
}