/**
 * Document Query Engine - Context-Aware Query System
 * Provides answers strictly from document content without hallucination
 */

interface QueryContext {
  documentId: string;
  fileName: string;
  content: string;
  documentType: string;
  previousQueries: QueryHistory[];
}

interface QueryHistory {
  question: string;
  answer: string;
  timestamp: string;
  confidence: number;
  sourceExcerpts: string[];
}

interface QueryResult {
  answer: string;
  confidence: number;
  sourceExcerpts: string[];
  reasoning: string;
  cannotAnswer: boolean;
  suggestions: string[];
}

export class DocumentQueryEngine {
  private static queryHistory: Map<string, QueryHistory[]> = new Map();

  /**
   * Query document with context-aware, no-hallucination approach
   */
  static async queryDocument(context: QueryContext, question: string): Promise<QueryResult> {
    const { documentId, fileName, content, documentType } = context;
    
    // Get previous queries for this document
    const previousQueries = this.queryHistory.get(documentId) || [];
    
    // Check if content extraction failed
    if (this.isContentExtractionFailed(content)) {
      return {
        answer: "Cannot answer - document content extraction failed",
        confidence: 0,
        sourceExcerpts: [],
        reasoning: "PDF content could not be extracted for analysis",
        cannotAnswer: true,
        suggestions: [
          "Try uploading the document in a different format (text, Word)",
          "Ensure the PDF is not password protected or corrupted",
          "Check if the document contains searchable text"
        ]
      };
    }

    // Extract relevant content based on question
    const relevantContent = this.extractRelevantContent(content, question);
    
    if (relevantContent.length === 0) {
      return {
        answer: "Cannot answer - no relevant information found in document",
        confidence: 0,
        sourceExcerpts: [],
        reasoning: `The document does not contain information related to: ${question}`,
        cannotAnswer: true,
        suggestions: this.generateQuestionSuggestions(content, documentType)
      };
    }

    // Generate answer strictly from document content
    const result = this.generateContextualAnswer(question, relevantContent, previousQueries);
    
    // Store query for learning
    this.storeQuery(documentId, {
      question,
      answer: result.answer,
      timestamp: new Date().toISOString(),
      confidence: result.confidence,
      sourceExcerpts: result.sourceExcerpts
    });

    return result;
  }

  /**
   * Check if content extraction failed
   */
  private static isContentExtractionFailed(content: string): boolean {
    return content.includes('Content extraction from PDF failed') ||
           content.includes('Content extraction failed') ||
           content.includes('Content not available') ||
           content.length < 100;
  }

  /**
   * Extract relevant content sections based on question
   */
  private static extractRelevantContent(content: string, question: string): string[] {
    const lowerQuestion = question.toLowerCase();
    const lowerContent = content.toLowerCase();
    const relevantSections: string[] = [];

    // Split content into paragraphs
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    
    // Extract keywords from question
    const questionKeywords = this.extractKeywords(lowerQuestion);
    
    // Find paragraphs containing relevant keywords
    paragraphs.forEach(paragraph => {
      const lowerParagraph = paragraph.toLowerCase();
      const matchCount = questionKeywords.filter(keyword => 
        lowerParagraph.includes(keyword)
      ).length;
      
      if (matchCount > 0) {
        relevantSections.push(paragraph.trim());
      }
    });

    // If no direct matches, look for semantic relationships
    if (relevantSections.length === 0) {
      relevantSections.push(...this.findSemanticMatches(content, lowerQuestion));
    }

    return relevantSections.slice(0, 5); // Limit to 5 most relevant sections
  }

  /**
   * Extract keywords from question
   */
  private static extractKeywords(question: string): string[] {
    // Remove common stop words
    const stopWords = ['what', 'who', 'when', 'where', 'why', 'how', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    return question
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .map(word => word.replace(/[^\w]/g, ''));
  }

  /**
   * Find semantic matches for complex questions
   */
  private static findSemanticMatches(content: string, question: string): string[] {
    const matches: string[] = [];
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    
    // Topic-based matching
    const topicMappings = {
      'date': ['date', 'time', 'deadline', 'schedule', 'period', 'year', 'month'],
      'money': ['cost', 'price', 'budget', 'funding', 'payment', 'fee', 'amount', '$'],
      'person': ['name', 'person', 'individual', 'party', 'defendant', 'plaintiff'],
      'location': ['address', 'location', 'place', 'court', 'jurisdiction', 'venue'],
      'legal': ['law', 'legal', 'statute', 'regulation', 'compliance', 'requirement'],
      'process': ['procedure', 'process', 'method', 'steps', 'how', 'requirements']
    };

    Object.entries(topicMappings).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => question.includes(keyword))) {
        paragraphs.forEach(paragraph => {
          if (keywords.some(keyword => paragraph.toLowerCase().includes(keyword))) {
            matches.push(paragraph.trim());
          }
        });
      }
    });

    return matches.slice(0, 3);
  }

  /**
   * Generate contextual answer from relevant content
   */
  private static generateContextualAnswer(question: string, relevantContent: string[], previousQueries: QueryHistory[]): QueryResult {
    const lowerQuestion = question.toLowerCase();
    
    // Check for specific question types
    if (lowerQuestion.includes('what') || lowerQuestion.includes('define')) {
      return this.generateDefinitionAnswer(question, relevantContent);
    } else if (lowerQuestion.includes('when') || lowerQuestion.includes('date')) {
      return this.generateDateAnswer(question, relevantContent);
    } else if (lowerQuestion.includes('who') || lowerQuestion.includes('name')) {
      return this.generatePersonAnswer(question, relevantContent);
    } else if (lowerQuestion.includes('where') || lowerQuestion.includes('location')) {
      return this.generateLocationAnswer(question, relevantContent);
    } else if (lowerQuestion.includes('how much') || lowerQuestion.includes('cost') || lowerQuestion.includes('price')) {
      return this.generateFinancialAnswer(question, relevantContent);
    } else if (lowerQuestion.includes('why') || lowerQuestion.includes('reason')) {
      return this.generateReasoningAnswer(question, relevantContent);
    } else if (lowerQuestion.includes('how') || lowerQuestion.includes('process')) {
      return this.generateProcessAnswer(question, relevantContent);
    }

    // General answer generation
    return this.generateGeneralAnswer(question, relevantContent);
  }

  /**
   * Generate definition-based answers
   */
  private static generateDefinitionAnswer(question: string, relevantContent: string[]): QueryResult {
    const sourceExcerpts = relevantContent.slice(0, 3);
    const confidence = relevantContent.length > 0 ? 0.8 : 0.0;
    
    if (relevantContent.length === 0) {
      return {
        answer: "No definition found in document",
        confidence: 0,
        sourceExcerpts: [],
        reasoning: "Document does not contain definitional information for this question",
        cannotAnswer: true,
        suggestions: ["Try asking about specific terms mentioned in the document"]
      };
    }

    const answer = `Based on the document: ${relevantContent[0].substring(0, 300)}${relevantContent[0].length > 300 ? '...' : ''}`;
    
    return {
      answer,
      confidence,
      sourceExcerpts,
      reasoning: "Answer extracted from document content",
      cannotAnswer: false,
      suggestions: []
    };
  }

  /**
   * Generate date-based answers
   */
  private static generateDateAnswer(question: string, relevantContent: string[]): QueryResult {
    const datePatterns = [
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g
    ];

    const foundDates: string[] = [];
    const sourceExcerpts: string[] = [];

    relevantContent.forEach(content => {
      datePatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          foundDates.push(...matches);
          sourceExcerpts.push(content.substring(0, 200) + '...');
        }
      });
    });

    if (foundDates.length === 0) {
      return {
        answer: "No specific dates found in document for this question",
        confidence: 0,
        sourceExcerpts: [],
        reasoning: "Document does not contain date information relevant to the question",
        cannotAnswer: true,
        suggestions: ["Ask about general timeframes or periods mentioned in the document"]
      };
    }

    const uniqueDates = [...new Set(foundDates)];
    const answer = `Document contains the following relevant dates: ${uniqueDates.join(', ')}`;
    
    return {
      answer,
      confidence: 0.9,
      sourceExcerpts,
      reasoning: "Dates extracted directly from document content",
      cannotAnswer: false,
      suggestions: []
    };
  }

  /**
   * Generate financial answers
   */
  private static generateFinancialAnswer(question: string, relevantContent: string[]): QueryResult {
    const moneyPatterns = [
      /\$[\d,]+(?:\.\d{2})?/g,
      /\d+(?:\.\d+)?%/g,
      /\b\d+\s*(?:million|billion|thousand|dollars?)\b/gi
    ];

    const foundAmounts: string[] = [];
    const sourceExcerpts: string[] = [];

    relevantContent.forEach(content => {
      moneyPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          foundAmounts.push(...matches);
          sourceExcerpts.push(content.substring(0, 200) + '...');
        }
      });
    });

    if (foundAmounts.length === 0) {
      return {
        answer: "No financial information found in document for this question",
        confidence: 0,
        sourceExcerpts: [],
        reasoning: "Document does not contain financial data relevant to the question",
        cannotAnswer: true,
        suggestions: ["Ask about general costs or budget information if available"]
      };
    }

    const uniqueAmounts = [...new Set(foundAmounts)];
    const answer = `Document contains the following financial information: ${uniqueAmounts.join(', ')}`;
    
    return {
      answer,
      confidence: 0.9,
      sourceExcerpts,
      reasoning: "Financial information extracted directly from document content",
      cannotAnswer: false,
      suggestions: []
    };
  }

  /**
   * Generate general answers
   */
  private static generateGeneralAnswer(question: string, relevantContent: string[]): QueryResult {
    if (relevantContent.length === 0) {
      return {
        answer: "Cannot answer - no relevant information found in document",
        confidence: 0,
        sourceExcerpts: [],
        reasoning: "Document does not contain information to answer this question",
        cannotAnswer: true,
        suggestions: ["Try asking about topics that are specifically mentioned in the document"]
      };
    }

    const mostRelevant = relevantContent[0];
    const answer = `Based on the document: ${mostRelevant.substring(0, 400)}${mostRelevant.length > 400 ? '...' : ''}`;
    
    return {
      answer,
      confidence: 0.7,
      sourceExcerpts: relevantContent.slice(0, 2),
      reasoning: "Answer extracted from most relevant document section",
      cannotAnswer: false,
      suggestions: []
    };
  }

  /**
   * Generate question suggestions based on document content
   */
  private static generateQuestionSuggestions(content: string, documentType: string): string[] {
    const suggestions: string[] = [];
    const lowerContent = content.toLowerCase();

    // Document type specific suggestions
    if (documentType === 'proposal') {
      suggestions.push(
        "What is the main objective of this proposal?",
        "What is the budget for this project?",
        "When is the project timeline?",
        "Who are the target beneficiaries?"
      );
    } else if (documentType === 'contract') {
      suggestions.push(
        "What are the key terms of this contract?",
        "When does this contract expire?",
        "What are the payment terms?",
        "Who are the parties involved?"
      );
    } else if (documentType === 'country_report') {
      suggestions.push(
        "What is the reporting period?",
        "What are the main human rights concerns?",
        "What government actions are documented?",
        "What international standards are referenced?"
      );
    } else {
      // General suggestions based on content
      if (lowerContent.includes('date') || lowerContent.includes('deadline')) {
        suggestions.push("What are the important dates mentioned?");
      }
      if (lowerContent.includes('$') || lowerContent.includes('cost')) {
        suggestions.push("What financial information is provided?");
      }
      if (lowerContent.includes('requirement') || lowerContent.includes('must')) {
        suggestions.push("What are the key requirements?");
      }
      if (lowerContent.includes('process') || lowerContent.includes('procedure')) {
        suggestions.push("What processes are described?");
      }
    }

    return suggestions.slice(0, 4);
  }

  /**
   * Store query for learning
   */
  private static storeQuery(documentId: string, query: QueryHistory): void {
    const queries = this.queryHistory.get(documentId) || [];
    queries.push(query);
    this.queryHistory.set(documentId, queries);
  }

  /**
   * Get query history for document
   */
  static getQueryHistory(documentId: string): QueryHistory[] {
    return this.queryHistory.get(documentId) || [];
  }

  /**
   * Generate other answer types (placeholder methods)
   */
  private static generatePersonAnswer(question: string, relevantContent: string[]): QueryResult {
    return this.generateGeneralAnswer(question, relevantContent);
  }

  private static generateLocationAnswer(question: string, relevantContent: string[]): QueryResult {
    return this.generateGeneralAnswer(question, relevantContent);
  }

  private static generateReasoningAnswer(question: string, relevantContent: string[]): QueryResult {
    return this.generateGeneralAnswer(question, relevantContent);
  }

  private static generateProcessAnswer(question: string, relevantContent: string[]): QueryResult {
    return this.generateGeneralAnswer(question, relevantContent);
  }
}