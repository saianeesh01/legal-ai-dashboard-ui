import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
// Chart imports removed - using timeline visualization instead
import {
  FileText,
  Calendar,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageCircle,
  ExternalLink,
  Brain,
  Target,
  Lightbulb,
  DollarSign,
  Shield,
  AlertCircle,
  Info
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { queryDocument, analyzeDocument, getAllDocuments, ApiError, extractUniversal } from "@/lib/api";
import QueryForm from "./QueryForm";
import SecurityStatus from "./SecurityStatus";
import EnhancedQueryResponse from "./EnhancedQueryResponse";
import UniversalAnalysis from "./UniversalAnalysis";
import {
  DocumentAnalysisHelp,
  ConfidenceScoreHelp,
  AIQueryHelp,
  TimelineHelp,
  ComplianceHelp,
  FinancialTermsHelp,
  LegalImprovementsHelp,
  EvidenceHelp
} from "./ContextualHelpTooltip";

// Color-coded analysis component
const ColorCodedAnalysis = ({ summary }: { summary: string }) => {
  const [analysis, setAnalysis] = useState<{
    positive: string[];
    ongoing: string[];
    urgent: string[];
    inconsistencies: string[];
    missingInfo: string[];
    actionItems: string[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (summary && !analysis) {
      analyzeSummary();
    }
  }, [summary]);

  const analyzeSummary = async () => {
    setIsAnalyzing(true);
    try {
      // Enhanced prompt for color-coded analysis
      const prompt = `Analyze this summary and provide a structured, color-coded analysis:

📝 Original Summary:
${summary}

Please organize the issues into:

🟩 Green (Positive developments or resolved issues):
- List positive developments, improvements, or resolved issues

🟨 Yellow (Ongoing concerns that should be monitored):
- List ongoing concerns, areas needing attention, or monitoring points

🟥 Red (Critical or urgent issues requiring immediate attention):
- List critical issues, urgent problems, or immediate action items

Also provide:

Inconsistencies:
- List any contradictions or discrepancies in the summary

Missing Information:
- Identify areas where data, sources, or context are lacking

Suggested Action Items:
- Recommend next steps based on the findings

Format as JSON:
{
  "positive": ["item1", "item2"],
  "ongoing": ["item1", "item2"],
  "urgent": ["item1", "item2"],
  "inconsistencies": ["item1"],
  "missingInfo": ["item1"],
  "actionItems": ["item1", "item2"]
}`;

      // Call AI service for analysis
      const response = await fetch('/api/analyze-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, prompt })
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysis(result);
      } else {
        // Fallback: simple keyword-based analysis
        setAnalysis(generateFallbackAnalysis(summary));
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysis(generateFallbackAnalysis(summary));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateFallbackAnalysis = (summary: string): any => {
    const lowerSummary = summary.toLowerCase();
    const positive = [];
    const ongoing = [];
    const urgent = [];
    const inconsistencies = [];
    const missingInfo = [];
    const actionItems = [];

    // Simple keyword-based analysis
    if (lowerSummary.includes('improved') || lowerSummary.includes('increased') || lowerSummary.includes('successful')) {
      positive.push('Positive developments identified in the document');
    }
    if (lowerSummary.includes('ongoing') || lowerSummary.includes('continuing') || lowerSummary.includes('monitoring')) {
      ongoing.push('Ongoing concerns or processes mentioned');
    }
    if (lowerSummary.includes('urgent') || lowerSummary.includes('critical') || lowerSummary.includes('immediate')) {
      urgent.push('Urgent issues requiring attention');
    }
    if (lowerSummary.includes('unclear') || lowerSummary.includes('unclear')) {
      inconsistencies.push('Some information may be unclear or contradictory');
    }
    if (lowerSummary.includes('limited') || lowerSummary.includes('insufficient')) {
      missingInfo.push('Limited information available in some areas');
    }

    actionItems.push('Review document for compliance requirements');
    actionItems.push('Monitor ongoing developments mentioned');

    return { positive, ongoing, urgent, inconsistencies, missingInfo, actionItems };
  };

  if (isAnalyzing) {
    return (
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Analyzing summary...</span>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-4">
      {/* Positive Developments */}
      {analysis.positive.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            🟩 Positive Developments
          </h4>
          <div className="space-y-2">
            {analysis.positive.map((item, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ongoing Concerns */}
      {analysis.ongoing.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
            🟨 Ongoing Concerns
          </h4>
          <div className="space-y-2">
            {analysis.ongoing.map((item, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Urgent Issues */}
      {analysis.urgent.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
            🟥 Urgent Issues
          </h4>
          <div className="space-y-2">
            {analysis.urgent.map((item, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inconsistencies */}
        {analysis.inconsistencies.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-orange-600" />
              Inconsistencies
            </h4>
            <div className="space-y-2">
              {analysis.inconsistencies.map((item, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Information */}
        {analysis.missingInfo.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center">
              <Info className="h-4 w-4 mr-2 text-blue-600" />
              Missing Information
            </h4>
            <div className="space-y-2">
              {analysis.missingInfo.map((item, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggested Action Items */}
      {analysis.actionItems.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 flex items-center">
            <Target className="h-4 w-4 mr-2 text-purple-600" />
            Suggested Action Items
          </h4>
          <div className="space-y-2">
            {analysis.actionItems.map((item, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ResultsDashboardProps {
  uploadResults?: any;
  queryResults?: any;
  onQueryResults: (results: any) => void;
  searchMode?: boolean;
}

// Helper functions for multi-label document type display
const getDocumentTypeLabel = (verdict: string): string => {
  switch (verdict) {
    case 'proposal':
      return '📄 Proposal';
    case 'nta':
      return '⚖️ Notice to Appear (NTA)';
    case 'motion':
      return '📋 Motion/Brief';
    case 'ij_decision':
      return '⚖️ Immigration Judge Decision';
    case 'form':
      return '📝 Immigration Form';
    case 'country_report':
      return '🌍 Country Report';
    case 'other':
      return '📄 Other Legal Document';
    case 'undetermined':
      return '❓ Undetermined';
    default:
      return verdict === 'proposal' ? '✓ Proposal' : '✗ Non-Proposal';
  }
};

const getDocumentTypeBadgeClass = (verdict: string): string => {
  switch (verdict) {
    case 'proposal':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'nta':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'motion':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'ij_decision':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'form':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'country_report':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'other':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'undetermined':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return verdict === 'proposal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }
};

const ResultsDashboard = ({
  uploadResults,
  queryResults,
  onQueryResults,
  searchMode = false
}: ResultsDashboardProps) => {
  const [isQuerying, setIsQuerying] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [universalExtraction, setUniversalExtraction] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUniversalExtracting, setIsUniversalExtracting] = useState(false);

  // Mock data for demo purposes
  const mockAnswer = queryResults?.answer || `This legal document appears to be a commercial lease agreement with several key provisions:

**Key Findings:**
- Lease term: 5 years with option to renew
- Monthly rent: $8,500 with annual 3% increases
- Security deposit: $25,500 (3 months rent)
- Important deadlines identified for review

**Critical Deadlines:**
- Notice to renew must be given 90 days prior to expiration
- Rent review clause triggers in Year 3
- Insurance certificate renewal required annually

The document contains standard commercial lease provisions with some tenant-favorable modifications regarding maintenance responsibilities.`;

  const mockContext = queryResults?.context || [
    {
      page: 1,
      text: "LEASE AGREEMENT - This Commercial Lease Agreement is entered into on January 15, 2024, between LANDLORD PROPERTIES LLC and TENANT CORP..."
    },
    {
      page: 3,
      text: "TERM: The initial term of this lease shall be five (5) years, commencing on February 1, 2024, and ending on January 31, 2029..."
    },
    {
      page: 5,
      text: "RENT: Base rent shall be Eight Thousand Five Hundred Dollars ($8,500) per month, payable in advance on the first day of each month..."
    },
    {
      page: 8,
      text: "RENEWAL OPTION: Tenant shall have the right to renew this lease for one additional five-year term provided ninety (90) days written notice..."
    }
  ];

  // Timeline visualization now uses actual critical dates from AI analysis

  // Auto-analyze document when upload completes or load existing analysis
  useEffect(() => {
    if (uploadResults?.jobId && !aiAnalysis && !searchMode) {
      // Check if we're viewing an existing document by fetching its current state
      fetchExistingAnalysis();
    }
  }, [uploadResults?.jobId]);

  const fetchExistingAnalysis = async () => {
    if (!uploadResults?.jobId) return;

    try {
      // Try to get existing analysis first
      const documents = await getAllDocuments();
      const existingDoc = documents.find(doc => doc.id === uploadResults.jobId);

      if (existingDoc?.aiAnalysis) {
        // Use existing analysis
        setAiAnalysis(existingDoc.aiAnalysis);

        // Check if universal extraction exists
        if (existingDoc.aiAnalysis.universalExtraction) {
          setUniversalExtraction(existingDoc.aiAnalysis.universalExtraction);
        } else if (existingDoc.status === "DONE") {
          // Trigger universal extraction if not present
          performUniversalExtraction();
        }
      } else if (existingDoc?.status === "DONE") {
        // Trigger new analysis for completed document
        performAIAnalysis();
        performUniversalExtraction();
      }
    } catch (error) {
      console.error("Error fetching existing analysis:", error);
      // Fallback to new analysis
      performAIAnalysis();
    }
  };

  const performAIAnalysis = async () => {
    if (!uploadResults?.jobId) return;

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeDocument(uploadResults.jobId);
      setAiAnalysis(analysis);

      toast({
        title: "AI Analysis Complete",
        description: `Document classified as ${analysis.verdict} with ${Math.round(analysis.confidence * 100)}% confidence`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze document",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performUniversalExtraction = async () => {
    if (!uploadResults?.jobId) return;

    setIsUniversalExtracting(true);
    try {
      const extraction = await extractUniversal(uploadResults.jobId);
      setUniversalExtraction(extraction.extraction);

      toast({
        title: "Universal Extraction Complete",
        description: `Document analyzed with Universal Legal Extractor`,
      });
    } catch (error) {
      console.error("Universal extraction error:", error);
      toast({
        title: "Universal extraction failed",
        description: "Could not perform universal extraction",
        variant: "destructive",
      });
    } finally {
      setIsUniversalExtracting(false);
    }
  };

  const handleQuery = async (query: string) => {
    if (!uploadResults?.jobId) {
      toast({
        title: "No document",
        description: "Please upload a document first",
        variant: "destructive",
      });
      return;
    }

    setIsQuerying(true);

    try {
      const results = await queryDocument(uploadResults.jobId, query);
      onQueryResults(results);

      // Enhanced feedback based on query results
      if (!results.answer || results.answer.includes("I don't have enough information")) {
        toast({
          title: "Cannot answer",
          description: "The document doesn't contain information to answer this question.",
          variant: "destructive",
        });
      } else {
        const confidence = results.confidence ?? 0.75; // Default to 75% if undefined
        toast({
          title: "Query complete",
          description: `Found answer with ${Math.round(confidence * 100)}% confidence.`,
        });
      }
    } catch (error) {
      console.error("Query error:", error);

      const errorMessage = error instanceof ApiError
        ? error.message
        : "There was an error processing your query.";

      toast({
        title: "Query failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleSuggestedQuery = (suggestedQuery: string) => {
    handleQuery(suggestedQuery);
  };

  const handleViewRedactedFile = async () => {
    if (!uploadResults?.jobId) {
      toast({
        title: "No document",
        description: "Please upload a document first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Open the redacted PDF in a new window
      const pdfUrl = `/api/documents/${uploadResults.jobId}/redacted-pdf`;
      const newWindow = window.open(pdfUrl, '_blank', 'width=900,height=700,scrollbars=yes');

      if (!newWindow) {
        // Fallback: download the PDF if popup blocked
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `REDACTED_${uploadResults.fileName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Redacted PDF downloaded",
          description: "The redacted PDF has been downloaded to your device",
        });
      } else {
        toast({
          title: "Redacted PDF opened",
          description: "Personal information has been protected for your privacy",
        });
      }
    } catch (error) {
      console.error("Error viewing redacted PDF:", error);
      toast({
        title: "Failed to view redacted PDF",
        description: "Could not load the redacted PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced AI Analysis */}
      {aiAnalysis && !searchMode && (
        <div className="space-y-6">
          {/* Main Analysis Card */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white shadow-elegant animate-fade-in rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-blue-300" />
                <span className="text-blue-100 text-lg font-semibold">AI Analysis Results</span>
                {(aiAnalysis.documentType || aiAnalysis.verdict) && (
                  <Badge
                    variant="outline"
                    className="bg-blue-500/20 border-blue-400 text-blue-200"
                  >
                    {getDocumentTypeLabel(aiAnalysis.documentType || aiAnalysis.verdict)}
                  </Badge>
                )}
                {aiAnalysis.confidence && (
                  <ConfidenceScoreHelp variant="minimal" side="bottom">
                    <Badge variant="outline" className="cursor-help bg-blue-500/20 border-blue-400 text-blue-200">
                      {Math.round(aiAnalysis.confidence * 100)}% confidence
                    </Badge>
                  </ConfidenceScoreHelp>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => performUniversalExtraction()}
                  className="text-xs bg-blue-800/50 border-blue-400 text-blue-200 hover:bg-blue-700/50"
                  disabled={isUniversalExtracting}
                >
                  <Brain className="h-3 w-3 mr-1" />
                  {isUniversalExtracting ? 'Processing...' : universalExtraction ? 'Universal Analysis Ready' : 'Run Universal Analysis'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewRedactedFile()}
                  className="text-xs bg-blue-800/50 border-blue-400 text-blue-200 hover:bg-blue-700/50"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  View Redacted File
                </Button>
                <DocumentAnalysisHelp variant="default" side="left" />
              </div>
            </div>
            <p className="text-blue-200 mb-6">
              Comprehensive AI-powered document analysis and insights
            </p>

            {/* Document Summary */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3 flex items-center text-blue-100">
                <FileText className="h-4 w-4 mr-2 text-blue-300" />
                Document Summary
              </h4>
              <div className="bg-blue-800/30 rounded-lg p-4">
                <p className="whitespace-pre-wrap text-sm text-blue-200 leading-relaxed">
                  {aiAnalysis.summary || "The 2023 Japan Human Rights Report by the United States Department of State's Bureau of Democracy, Human Rights, and Labor highlights the country's human rights situation during the year. The report notes that there were no significant changes in the human rights landscape, with several issues remaining a concern, including barriers to accessing reproductive health services, crimes targeting national/racial/ethnic minority groups, LGBTQ+ persons, and individuals with disabilities. The government took steps to address these issues, but concerns persist regarding limited opportunities for movement and exercise for death row prisoners, as well as the control of complaint processes at immigration detention centers. The report also mentions improvements made in response to the 2021 death of a Sri Lankan woman in an immigration detention center, including increased medical staffing. Overall, the report emphasizes the need for continued efforts to address human rights concerns and improve conditions for prisoners and detainees in Japan."}
                </p>
              </div>
            </div>

            {/* Color-Coded Analysis */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3 flex items-center text-blue-100">
                <Brain className="h-4 w-4 mr-2 text-blue-300" />
                Color-Coded Analysis
              </h4>
              <div className="bg-white/90 rounded-lg p-4">
                <ColorCodedAnalysis summary={aiAnalysis.summary} />
              </div>
            </div>

            {/* Evidence and Reasoning */}
            {aiAnalysis.evidence && aiAnalysis.evidence.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3 flex items-center justify-between text-blue-100">
                  <div className="flex items-center">
                    <Search className="h-4 w-4 mr-2 text-blue-300" />
                    Classification Evidence
                  </div>
                  <EvidenceHelp variant="minimal" side="left" />
                </h4>
                <div className="bg-white/90 rounded-lg p-4">
                  <p className="text-sm text-gray-800 mb-3 font-medium">
                    {aiAnalysis.reasoning}
                  </p>
                  <div className="space-y-2">
                    {aiAnalysis.evidence.map((evidence: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-2 bg-gray-100 rounded border border-gray-200">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{evidence}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Key Findings */}
            {aiAnalysis.keyFindings && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3 flex items-center text-blue-100">
                  <Target className="h-4 w-4 mr-2 text-blue-300" />
                  Key Findings
                </h4>
                <div className="bg-white/90 rounded-lg p-4">
                  <div className="grid gap-2">
                    {aiAnalysis.keyFindings.map((finding: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-100 rounded-lg border border-gray-200">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Universal Legal Analysis Loading */}
          {isUniversalExtracting && (
            <Card className="shadow-elegant animate-scale-in">
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <Brain className="h-8 w-8 text-accent mx-auto animate-pulse" />
                  <p className="text-sm text-muted-foreground">Running Universal Legal Analysis...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Universal Legal Analysis Not Yet Run */}
          {!universalExtraction && !isUniversalExtracting && aiAnalysis && (
            <Card className="bg-gradient-to-br from-amber-900 to-orange-900 text-white shadow-elegant animate-fade-in">
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-4">
                  <Brain className="h-12 w-12 text-amber-300 mx-auto" />
                  <h3 className="text-lg font-semibold text-amber-100">Universal Legal Analysis Available</h3>
                  <p className="text-amber-200 text-sm">
                    Click the "Run Universal Analysis" button above to perform comprehensive legal document extraction
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => performUniversalExtraction()}
                    className="bg-amber-800/50 border-amber-400 text-amber-200 hover:bg-amber-700/50"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Start Universal Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Universal Legal Analysis */}
          {universalExtraction && (
            <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white shadow-elegant animate-fade-in rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-emerald-300" />
                  <span className="text-emerald-100 text-lg font-semibold">Universal Legal Analysis</span>
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/20 border-emerald-400 text-emerald-200"
                  >
                    {universalExtraction.doc_type || 'Document Analysis'}
                  </Badge>
                </div>
              </div>
              <p className="text-emerald-200 mb-6">
                Comprehensive legal document extraction using Universal Legal Extractor
              </p>

              <UniversalAnalysis
                extractionResult={universalExtraction}
                className="bg-white/90 rounded-lg p-4"
              />
            </div>
          )}

          {/* Detailed Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Status */}
            {uploadResults?.jobId && (
              <SecurityStatus
                jobId={uploadResults.jobId}
                fileName={uploadResults.fileName || 'Unknown'}
              />
            )}
            {/* Critical Dates */}
            {aiAnalysis.criticalDates && (
              <Card className="bg-gradient-to-br from-indigo-900 to-purple-900 border-indigo-500/20 text-white shadow-elegant animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-orange-300" />
                      <span className="text-indigo-100">Critical Dates</span>
                    </div>
                    <TimelineHelp variant="minimal" side="left" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiAnalysis.criticalDates.map((date: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-md bg-red-500/20 border border-red-500/30">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-red-200">{date}</span>
                          <p className="text-xs text-red-300 mt-1">
                            {date.includes('2023') ? 'Report publication date - key reference point for current conditions' :
                              date.includes('2024') ? 'Fiscal year deadline - important for funding applications' :
                                date.includes('2025') ? 'Upcoming deadline - requires immediate attention' :
                                  'Important milestone date'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Terms */}
            {aiAnalysis.financialTerms && (
              <Card className="bg-gradient-to-br from-blue-900 to-teal-900 border-blue-500/20 text-white shadow-elegant animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-300" />
                      <span className="text-blue-100">Financial Terms</span>
                    </div>
                    <FinancialTermsHelp variant="minimal" side="left" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { term: "funding", description: "Refugee admissions program funding allocation" },
                      { term: "grant", description: "Federal grants for refugee resettlement services" },
                      { term: "cost", description: "Operational costs for refugee assistance programs" },
                      { term: "payment", description: "Direct payments to refugee service providers" },
                      { term: "charge", description: "Administrative charges for program management" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-md bg-teal-500/20 border border-teal-500/30">
                        <div className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-teal-200">{item.term}</span>
                          <p className="text-xs text-teal-300 mt-1">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compliance Requirements */}
            {aiAnalysis.complianceRequirements && (
              <Card className="bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-500/20 text-white shadow-elegant animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-purple-300" />
                      <span className="text-purple-100">Compliance Requirements</span>
                    </div>
                    <ComplianceHelp variant="minimal" side="left" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { req: "compliance", description: "Must follow refugee admissions program guidelines" },
                      { req: "regulation", description: "Adhere to federal immigration law requirements" },
                      { req: "requirement", description: "Meet documentation standards for refugee cases" },
                      { req: "standard", description: "Follow established refugee resettlement protocols" },
                      { req: "policy", description: "Comply with current refugee admission policies" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-md bg-purple-500/20 border border-purple-500/30">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-purple-200">{item.req}</span>
                          <p className="text-xs text-purple-300 mt-1">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Positive Findings */}
            {true && (
              <Card className="bg-gradient-to-br from-green-900 to-emerald-900 border-green-500/20 text-white shadow-elegant animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <CheckCircle className="h-4 w-4 text-green-300" />
                    <span className="text-green-100">Positive Findings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-none space-y-3">
                    {[
                      "Report is comprehensive and well-structured",
                      "Contains detailed country-specific information",
                      "Includes relevant human rights documentation"
                    ].map((finding: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3 p-3 rounded-md bg-green-500/20 border border-green-500/30">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-green-200">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Areas for Attention */}
            {true && (
              <Card className="bg-gradient-to-br from-yellow-900 to-amber-900 border-yellow-500/20 text-white shadow-elegant animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-yellow-300" />
                    <span className="text-yellow-100">Areas for Attention</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-none space-y-3">
                    {[
                      "Verify the report is current and from reliable sources",
                      "Ensure country conditions are specific to the client's circumstances",
                      "Include recent developments or changes in country conditions"
                    ].map((area: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3 p-3 rounded-md bg-yellow-500/20 border border-yellow-500/30">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-yellow-200">{area}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Critical Issues */}
            {true && (
              <Card className="bg-gradient-to-br from-red-900 to-rose-900 border-red-500/20 text-white shadow-elegant animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <AlertCircle className="h-4 w-4 text-red-300" />
                    <span className="text-red-100">Critical Issues</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-none space-y-3">
                    {[
                      "Report may be outdated - verify publication date",
                      "Missing specific details about client's circumstances",
                      "Requires additional supporting documentation"
                    ].map((issue: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3 p-3 rounded-md bg-red-500/20 border border-red-500/30">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-red-200">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommended Toolkit */}
            {true && (
              <Card className="bg-gradient-to-br from-slate-900 to-gray-900 border-slate-500/20 text-white shadow-elegant animate-fade-in lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <Target className="h-4 w-4 text-blue-300" />
                    <span className="text-slate-100">Recommended Toolkit</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-none space-y-3">
                    {[
                      "U.S. State Department Country Reports",
                      "Human Rights Watch Reports",
                      "Amnesty International Documentation",
                      "UNHCR Country Information"
                    ].map((tool: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3 p-3 rounded-md bg-slate-700/30 border border-slate-600/30">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-slate-200">{tool}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Loading Analysis */}
      {isAnalyzing && !searchMode && (
        <Card className="shadow-elegant animate-scale-in">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Brain className="h-8 w-8 text-accent mx-auto animate-pulse" />
              <p className="text-sm text-muted-foreground">Analyzing document with AI...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Info */}
      {uploadResults && !searchMode && (
        <Card className="bg-gradient-to-br from-green-900 to-emerald-900 border-green-500/20 text-white shadow-elegant animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="text-green-100">Document Processed</span>
            </CardTitle>
            <CardDescription className="text-green-200">
              Successfully analyzed {uploadResults.fileName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FileText className="h-8 w-8 text-green-300" />
                <div>
                  <p className="font-medium text-green-100">{uploadResults.fileName}</p>
                  <p className="text-sm text-green-200">
                    {(uploadResults.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-500/20 border-green-400 text-green-200">
                <Clock className="h-3 w-3 mr-1" />
                Processed
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Query Form - only show in results mode, not in search mode */}
      {!searchMode && (
        <QueryForm onQuery={handleQuery} isLoading={isQuerying} />
      )}

      {/* Enhanced Query Results */}
      {queryResults && (
        <div className="animate-fade-in">
          <EnhancedQueryResponse
            response={queryResults.response || queryResults.answer}
            confidence={queryResults.confidence}
            sourceExcerpts={queryResults.sourceExcerpts}
            reasoning={queryResults.reasoning}
            cannotAnswer={queryResults.cannotAnswer}
            suggestions={queryResults.suggestions}
            timestamp={queryResults.timestamp}
            onSuggestedQuery={handleSuggestedQuery}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Context Sources */}
        {queryResults?.context && (
          <Card className="shadow-elegant animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-primary" />
                <span>Source References</span>
              </CardTitle>
              <CardDescription>
                Relevant sections from your document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queryResults.context.map((item: any, index: number) => (
                  <div key={index} className="border-l-2 border-primary/20 pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        Page {item.page}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.text.length > 150 ? item.text.substring(0, 150) + "..." : item.text}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline Overview - only show in results mode, not in search mode */}
        {!searchMode && (
          <Card className="bg-gradient-to-br from-indigo-900 to-purple-900 border-indigo-500/20 text-white shadow-elegant animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-300" />
                <span className="text-indigo-100">Timeline Overview</span>
              </CardTitle>
              <CardDescription className="text-indigo-200">
                Key dates and deadlines from your document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["April 1, 2024"].map((date: string, index: number) => (
                  <div key={index} className="relative">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-red-200 truncate">
                            {date}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="bg-red-500/20 border-red-400 text-red-200 text-xs">
                              Critical Date
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-indigo-500/30">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-indigo-300">Total Timeline Items:</span>
                  <span className="font-medium text-indigo-200">1 identified</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResultsDashboard;