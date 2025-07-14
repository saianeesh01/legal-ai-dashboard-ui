import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpCircle, Brain, FileText, Search, Upload, Calendar, AlertCircle, CheckCircle, Scale, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type HelpContext = 
  | 'upload'
  | 'document-analysis'
  | 'document-types'
  | 'confidence-scores'
  | 'search-filter'
  | 'ai-query'
  | 'timeline'
  | 'compliance'
  | 'financial-terms'
  | 'legal-improvements'
  | 'evidence'
  | 'immigration-forms'
  | 'court-documents'
  | 'proposal-detection';

interface ContextualHelpProps {
  context: HelpContext;
  variant?: 'default' | 'minimal' | 'detailed';
  side?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Help Content Data                                                 */
/* ------------------------------------------------------------------ */

const getHelpContent = (context: HelpContext, variant: 'default' | 'minimal' | 'detailed' = 'default') => {
  const content = {
    upload: {
      icon: <Upload className="h-4 w-4" />,
      title: "Document Upload",
      description: variant === 'minimal' 
        ? "Upload PDF, JPEG, or PNG files for AI analysis"
        : "Upload legal documents for comprehensive AI-powered analysis. Supports PDF, JPEG, and PNG formats up to 10MB.",
      details: variant === 'detailed' ? [
        "✓ Supports PDF documents with text content",
        "✓ Image files (JPEG, PNG) with OCR processing", 
        "✓ Automatic duplicate detection and handling",
        "✓ Real-time processing status with progress tracking",
        "✓ Secure file handling and storage"
      ] : [],
      tips: variant !== 'minimal' ? [
        "Ensure PDFs are not password-protected for best results",
        "High-resolution images provide better OCR accuracy",
        "Documents with clear text structure analyze more accurately"
      ] : []
    },

    'document-analysis': {
      icon: <Brain className="h-4 w-4" />,
      title: "AI Document Analysis",
      description: variant === 'minimal'
        ? "Advanced AI classification and content extraction"
        : "Our AI system performs multi-label classification to identify document types and extract key information from legal documents.",
      details: variant === 'detailed' ? [
        "🎯 Multi-label classification (7 document types)",
        "📊 Evidence-based confidence scoring", 
        "🔍 Content extraction and summarization",
        "📋 Key findings and critical information identification",
        "⚖️ Legal significance assessment"
      ] : [],
      tips: variant !== 'minimal' ? [
        "Higher confidence scores indicate more reliable classification",
        "Evidence list shows specific patterns that drove the classification",
        "Filename-based analysis provides fallback when content extraction fails"
      ] : []
    },

    'document-types': {
      icon: <FileText className="h-4 w-4" />,
      title: "Document Type Classification",
      description: variant === 'minimal'
        ? "7 specialized legal document categories"
        : "Our system identifies 7 distinct types of legal documents with specialized analysis for each category.",
      details: variant === 'detailed' ? [
        "📋 Proposals - Grant applications and funding requests",
        "🚨 Notice to Appear (NTA) - Immigration court proceedings",
        "⚖️ Motions/Briefs - Legal pleadings and court filings", 
        "👨‍⚖️ Immigration Judge Decisions - Court rulings and orders",
        "📄 Immigration Forms - Official government applications",
        "🌍 Country Reports - Human rights and conditions analysis",
        "📚 Other Legal Documents - General legal documentation"
      ] : [],
      tips: variant !== 'minimal' ? [
        "Each document type has specialized analysis tailored to its legal significance",
        "Color-coded badges help quickly identify document categories",
        "Filter by document type to focus on specific categories"
      ] : []
    },

    'confidence-scores': {
      icon: <CheckCircle className="h-4 w-4" />,
      title: "Confidence Scoring",
      description: variant === 'minimal'
        ? "AI confidence levels from 40% to 95%"
        : "Confidence scores indicate how certain the AI is about document classification based on evidence strength.",
      details: variant === 'detailed' ? [
        "🟢 90-95% - Very High Confidence (Strong evidence)",
        "🔵 70-89% - High Confidence (Multiple evidence points)",
        "🟡 60-69% - Moderate Confidence (Some evidence)",
        "🟠 40-59% - Low Confidence (Limited evidence)",
        "🔴 Below 40% - Undetermined (Insufficient evidence)"
      ] : [],
      tips: variant !== 'minimal' ? [
        "Higher confidence scores mean more reliable classifications",
        "Low confidence may indicate unclear document content or mixed signals",
        "Evidence list provides transparency into classification reasoning"
      ] : []
    },

    'search-filter': {
      icon: <Search className="h-4 w-4" />,
      title: "Document Search & Filtering",
      description: variant === 'minimal'
        ? "Search by name and filter by document type"
        : "Powerful search and filtering tools to quickly find specific documents in your library.",
      details: variant === 'detailed' ? [
        "🔍 Real-time document name search",
        "🏷️ Filter by document type categories",
        "📊 Live results count and summary",
        "🗂️ Multi-criteria filtering support",
        "⚡ Instant search results"
      ] : [],
      tips: variant !== 'minimal' ? [
        "Use partial document names for broader search results",
        "Combine name search with type filters for precise results",
        "Clear filters to return to full document library view"
      ] : []
    },

    'ai-query': {
      icon: <Brain className="h-4 w-4" />,
      title: "AI Query System",
      description: variant === 'minimal'
        ? "Ask specific questions about your documents"
        : "Intelligent question-answering system that provides contextual responses based on document content.",
      details: variant === 'detailed' ? [
        "❓ Natural language question processing",
        "🎯 Context-aware response generation", 
        "📝 Document-specific content analysis",
        "💡 Suggested questions for common queries",
        "🔍 Deep content understanding and extraction"
      ] : [],
      tips: variant !== 'minimal' ? [
        "Ask specific questions about sections, clauses, or terms",
        "Request explanations of legal language or complex provisions", 
        "Inquire about deadlines, obligations, or key dates for better results"
      ] : []
    },

    timeline: {
      icon: <Calendar className="h-4 w-4" />,
      title: "Timeline Analysis",
      description: variant === 'minimal'
        ? "Critical dates and deadlines extraction"
        : "Automated extraction and visualization of important dates, deadlines, and time-sensitive information.",
      details: variant === 'detailed' ? [
        "📅 Critical date identification and extraction",
        "⏰ Deadline tracking and categorization",
        "🎯 Timeline visualization with context",
        "🚨 Time-sensitive requirement highlighting",
        "📊 Chronological organization of events"
      ] : [],
      tips: variant !== 'minimal' ? [
        "Review timeline items for compliance deadlines",
        "Different badge colors indicate different types of dates",
        "Timeline shows actual dates extracted from document content"
      ] : []
    },

    compliance: {
      icon: <Scale className="h-4 w-4" />,
      title: "Compliance Requirements",
      description: variant === 'minimal'
        ? "Legal and regulatory compliance analysis"
        : "Identification and analysis of legal, regulatory, and professional compliance requirements.",
      details: variant === 'detailed' ? [
        "⚖️ Legal compliance requirement identification",
        "📋 Regulatory standard analysis",
        "🏛️ Professional ethics requirements",
        "📊 Documentation and reporting obligations",
        "🔍 Risk assessment and mitigation guidance"
      ] : [],
      tips: variant !== 'minimal' ? [
        "Review compliance requirements for legal obligations",
        "Cross-reference with applicable regulations and standards",
        "Consider compliance in document preparation and review"
      ] : []
    },

    'financial-terms': {
      icon: <FileText className="h-4 w-4" />,
      title: "Financial Terms Analysis",
      description: variant === 'minimal'
        ? "Budget, funding, and financial information extraction"
        : "Comprehensive analysis of financial terms, amounts, budget information, and funding details.",
      details: variant === 'detailed' ? [
        "💰 Financial amount and range identification",
        "📊 Budget breakdown and categorization",
        "📈 Funding source and allocation analysis",
        "💳 Payment terms and schedule extraction",
        "📋 Cost structure and financial obligation review"
      ] : [],
      tips: variant !== 'minimal' ? [
        "Financial terms include amounts, percentages, and budget categories",
        "Context provides understanding of financial relationships",
        "Review for accuracy of extracted financial information"
      ] : []
    },

    'legal-improvements': {
      icon: <AlertCircle className="h-4 w-4" />,
      title: "Improvement Suggestions",
      description: variant === 'minimal'
        ? "AI-generated recommendations for document enhancement"
        : "Intelligent suggestions for improving document quality, legal compliance, and effectiveness.",
      details: variant === 'detailed' ? [
        "📝 Document structure and organization improvements",
        "⚖️ Legal argument strengthening suggestions",
        "📊 Evidence and supporting documentation recommendations",
        "🎯 Clarity and precision enhancement tips",
        "📋 Compliance and procedural improvement guidance"
      ] : [],
      tips: variant !== 'minimal' ? [
        "Suggestions are tailored to specific document types",
        "Implement recommendations to strengthen legal arguments",
        "Consider suggestions in context of your specific legal strategy"
      ] : []
    },

    evidence: {
      icon: <Gavel className="h-4 w-4" />,
      title: "Classification Evidence",
      description: variant === 'minimal'
        ? "Specific patterns and indicators used for classification"
        : "Transparent display of specific evidence and patterns that led to document classification decisions.",
      details: variant === 'detailed' ? [
        "🔍 Pattern matching results and indicators",
        "📝 Specific text phrases and keywords identified",
        "📄 Filename analysis and structural patterns",
        "🎯 Legal terminology and format recognition",
        "📊 Evidence strength and confidence correlation"
      ] : [],
      tips: variant !== 'minimal' ? [
        "Evidence provides transparency into AI decision-making",
        "Multiple evidence points increase classification confidence",
        "Review evidence to understand document characteristics"
      ] : []
    },

    'immigration-forms': {
      icon: <FileText className="h-4 w-4" />,
      title: "Immigration Forms",
      description: variant === 'minimal'
        ? "Official immigration applications and petitions"
        : "Analysis of official immigration forms, applications, and government petitions for immigration benefits.",
      details: variant === 'detailed' ? [
        "📄 Form I-589 (Asylum Applications)",
        "📋 Form I-130 (Family Petitions)",
        "🏛️ Form I-485 (Adjustment of Status)",
        "📝 Form N-400 (Naturalization Applications)",
        "🔍 Supporting documentation requirements"
      ] : [],
      tips: variant !== 'minimal' ? [
        "Immigration forms require specific supporting documentation",
        "Review completion requirements and deadlines carefully",
        "Ensure all required fields and signatures are present"
      ] : []
    },

    'court-documents': {
      icon: <Gavel className="h-4 w-4" />,
      title: "Court Documents",
      description: variant === 'minimal'
        ? "Immigration court filings and legal proceedings"
        : "Analysis of immigration court documents, including motions, decisions, and procedural filings.",
      details: variant === 'detailed' ? [
        "⚖️ Immigration Judge decisions and orders",
        "📋 Motions to reopen and reconsider",
        "🚨 Notice to Appear (NTA) documents",
        "📄 Court briefs and memoranda of law",
        "🏛️ Administrative and procedural documents"
      ] : [],
      tips: variant !== 'minimal' ? [
        "Court documents have strict formatting and procedural requirements",
        "Review local court rules for specific filing requirements",
        "Ensure proper service and notification procedures are followed"
      ] : []
    },

    'proposal-detection': {
      icon: <CheckCircle className="h-4 w-4" />,
      title: "Proposal Detection",
      description: variant === 'minimal'
        ? "Grant applications and funding request identification"
        : "Advanced detection of grant proposals, funding applications, and project requests using specialized AI analysis.",
      details: variant === 'detailed' ? [
        "💰 Grant application and funding request detection",
        "📊 Budget and financial component analysis",
        "🎯 Project scope and deliverable identification",
        "📅 Timeline and milestone extraction",
        "🏛️ Compliance and requirement assessment"
      ] : [],
      tips: variant !== 'minimal' ? [
        "Proposal documents typically include budget, timeline, and scope sections",
        "Review funding requirements and eligibility criteria carefully",
        "Ensure all required components are included and properly formatted"
      ] : []
    }
  };

  return content[context] || content['document-analysis'];
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export const ContextualHelpTooltip: React.FC<ContextualHelpProps> = ({
  context,
  variant = 'default',
  side = 'top',
  children,
  className
}) => {
  const helpContent = getHelpContent(context, variant);

  const triggerElement = children || (
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-6 w-6 p-0 text-muted-foreground hover:text-foreground", className)}
    >
      <HelpCircle className="h-4 w-4" />
    </Button>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {triggerElement}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-sm p-4 space-y-2"
          sideOffset={8}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="text-primary">
              {helpContent.icon}
            </div>
            <h4 className="font-medium text-sm">{helpContent.title}</h4>
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed">
            {helpContent.description}
          </p>

          {helpContent.details && helpContent.details.length > 0 && (
            <div className="space-y-1">
              <h5 className="text-xs font-medium">Key Features:</h5>
              <ul className="text-xs space-y-0.5">
                {helpContent.details.map((detail, index) => (
                  <li key={index} className="text-muted-foreground">
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {helpContent.tips && helpContent.tips.length > 0 && (
            <div className="space-y-1 pt-2 border-t">
              <h5 className="text-xs font-medium flex items-center gap-1">
                💡 Tips:
              </h5>
              <ul className="text-xs space-y-0.5">
                {helpContent.tips.map((tip, index) => (
                  <li key={index} className="text-muted-foreground">
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/* ------------------------------------------------------------------ */
/*  Specialized Help Components                                       */
/* ------------------------------------------------------------------ */

export const UploadHelp: React.FC<Omit<ContextualHelpProps, 'context'>> = (props) => (
  <ContextualHelpTooltip context="upload" {...props} />
);

export const DocumentAnalysisHelp: React.FC<Omit<ContextualHelpProps, 'context'>> = (props) => (
  <ContextualHelpTooltip context="document-analysis" {...props} />
);

export const DocumentTypesHelp: React.FC<Omit<ContextualHelpProps, 'context'>> = (props) => (
  <ContextualHelpTooltip context="document-types" {...props} />
);

export const ConfidenceScoreHelp: React.FC<Omit<ContextualHelpProps, 'context'>> = (props) => (
  <ContextualHelpTooltip context="confidence-scores" {...props} />
);

export const SearchFilterHelp: React.FC<Omit<ContextualHelpProps, 'context'>> = (props) => (
  <ContextualHelpTooltip context="search-filter" {...props} />
);

export const AIQueryHelp: React.FC<Omit<ContextualHelpProps, 'context'>> = (props) => (
  <ContextualHelpTooltip context="ai-query" {...props} />
);

export const TimelineHelp: React.FC<Omit<ContextualHelpProps, 'context'>> = (props) => (
  <ContextualHelpTooltip context="timeline" {...props} />
);

export const ComplianceHelp: React.FC<Omit<ContextualHelpProps, 'context'>> = (props) => (
  <ContextualHelpTooltip context="compliance" {...props} />
);

export const FinancialTermsHelp: React.FC<Omit<ContextualHelpProps, 'context'>> = (props) => (
  <ContextualHelpTooltip context="financial-terms" {...props} />
);

export const LegalImprovementsHelp: React.FC<Omit<ContextualHelpProps, 'context'>> = (props) => (
  <ContextualHelpTooltip context="legal-improvements" {...props} />
);

export const EvidenceHelp: React.FC<Omit<ContextualHelpProps, 'context'>> = (props) => (
  <ContextualHelpTooltip context="evidence" {...props} />
);

export const ImmigrationFormsHelp: React.FC<Omit<ContextualHelpProps, 'context'>> = (props) => (
  <ContextualHelpTooltip context="immigration-forms" {...props} />
);

export const CourtDocumentsHelp: React.FC<Omit<ContextualHelpProps, 'context'>> = (props) => (
  <ContextualHelpTooltip context="court-documents" {...props} />
);

export const ProposalDetectionHelp: React.FC<Omit<ContextualHelpProps, 'context'>> = (props) => (
  <ContextualHelpTooltip context="proposal-detection" {...props} />
);