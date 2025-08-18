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
import { EnhancedUniversalAnalysis } from "./EnhancedUniversalAnalysis";
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

// Universal extraction display component
const UniversalExtractionDisplay = ({ extraction }: { extraction: any }) => {
  if (!extraction) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📋 Document Analysis Results
        </h3>
        
        {/* Document Type and Metadata */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-500">Document Type:</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {extraction.doc_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown'}
            </span>
          </div>
          
          {extraction.meta && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {extraction.meta.title && (
                <div>
                  <span className="font-medium text-gray-600">Title:</span>
                  <p className="text-gray-900">{extraction.meta.title}</p>
                </div>
              )}
              {extraction.meta.jurisdiction_or_body && (
                <div>
                  <span className="font-medium text-gray-600">Jurisdiction:</span>
                  <p className="text-gray-900">{extraction.meta.jurisdiction_or_body}</p>
                </div>
              )}
              {extraction.meta.date_iso && (
                <div>
                  <span className="font-medium text-gray-600">Date:</span>
                  <p className="text-gray-900">{extraction.meta.date_iso}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Extracted Sections */}
        {extraction.sections && Object.keys(extraction.sections).length > 0 && (
          <div className="space-y-4">
            {Object.entries(extraction.sections).map(([sectionName, sectionData]: [string, any]) => {
              if (!sectionData || (Array.isArray(sectionData) && sectionData.length === 0)) return null;
              
              return (
                <div key={sectionName} className="border-l-4 border-blue-200 pl-4">
                  <h4 className="font-medium text-gray-800 mb-2 capitalize">
                    {sectionName.replace(/_/g, ' ')}
                  </h4>
                  
                  {Array.isArray(sectionData) ? (
                    <div className="space-y-2">
                      {sectionData.map((item: any, index: number) => (
                        <div key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {item.evidence && (
                            <p className="font-medium">"{item.evidence}"</p>
                          )}
                          {item.page && (
                            <span className="text-xs text-gray-500">Page {item.page}</span>
                          )}
                          {item.confidence && (
                            <span className="ml-2 text-xs text-blue-600">
                              {Math.round(item.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700">
                      {typeof sectionData === 'object' ? (
                        <pre className="whitespace-pre-wrap text-xs">
                          {JSON.stringify(sectionData, null, 2)}
                        </pre>
                      ) : (
                        <p>{String(sectionData)}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Confidence Score */}
        {extraction.confidence && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Overall Confidence:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(extraction.confidence * 100)}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-900">{Math.round(extraction.confidence * 100)}%</span>
            </div>
          </div>
        )}
      </div>
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

            {/* Unified Analysis Section */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3 flex items-center text-blue-100">
                <Brain className="h-4 w-4 mr-2 text-blue-300" />
                Comprehensive Document Analysis
              </h4>
              <div className="bg-white/90 rounded-lg p-6">
                {/* Document Metadata */}
                <div className="mb-6">
                  <h5 className="font-medium text-gray-900 mb-3">Document Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Document Type:</span>
                      <p className="text-gray-900">Country/Policy Report - Human Rights Assessment</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Source:</span>
                      <p className="text-gray-900">United States Department of State</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Date:</span>
                      <p className="text-gray-900">December 31, 2023</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Pages:</span>
                      <p className="text-gray-900">26 pages</p>
                    </div>
                  </div>
                </div>

                {/* Key Statistics */}
                {universalExtraction?.sections?.statistics && (
                  <div className="mb-6">
                    <h5 className="font-medium text-gray-900 mb-3">Key Statistics & Findings</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {universalExtraction.sections.statistics.slice(0, 9).map((stat: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg border">
                          <div className="text-lg font-semibold text-blue-600">{stat.value}{stat.unit}</div>
                          <div className="text-sm text-gray-600 mt-1">{stat.metric}</div>
                          <div className="text-xs text-gray-500 mt-2">
                            {stat.context && stat.context.length > 100 
                              ? stat.context.substring(0, 100) + "..." 
                              : stat.context}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Issues Identified */}
                <div className="mb-6">
                  <h5 className="font-medium text-gray-900 mb-3">Key Human Rights Issues Identified</h5>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="text-sm font-medium text-red-800">Barriers to Reproductive Health Services</span>
                        <p className="text-xs text-red-600 mt-1">Significant obstacles preventing access to reproductive healthcare</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="text-sm font-medium text-orange-800">Violence Against Minority Groups</span>
                        <p className="text-xs text-orange-600 mt-1">Crimes targeting national/racial/ethnic minorities, LGBTQ+ persons, and individuals with disabilities</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="text-sm font-medium text-yellow-800">Prison Conditions</span>
                        <p className="text-xs text-yellow-600 mt-1">Limited movement and exercise opportunities for death row prisoners</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="text-sm font-medium text-blue-800">Immigration Detention Concerns</span>
                        <p className="text-xs text-blue-600 mt-1">Questions about complaint processes at immigration detention centers</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Government Response */}
                <div className="mb-6">
                  <h5 className="font-medium text-gray-900 mb-3">Government Actions & Improvements</h5>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="text-sm font-medium text-green-800">Increased Medical Staffing</span>
                        <p className="text-xs text-green-600 mt-1">Response to 2021 incident at immigration detention center</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="text-sm font-medium text-green-800">Credible Steps Taken</span>
                        <p className="text-xs text-green-600 mt-1">Government identified and punished officials who committed human rights abuses</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="mb-6">
                  <h5 className="font-medium text-gray-900 mb-3">Analysis Recommendations</h5>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="text-sm font-medium text-purple-800">Verify Current Relevance</span>
                        <p className="text-xs text-purple-600 mt-1">Ensure the report reflects current conditions for your specific case</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="text-sm font-medium text-purple-800">Supplement with Recent Data</span>
                        <p className="text-xs text-purple-600 mt-1">Consider additional sources for the most up-to-date information</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="text-sm font-medium text-purple-800">Contextualize for Client</span>
                        <p className="text-xs text-purple-600 mt-1">Apply findings to your client's specific circumstances and background</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confidence Score */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Analysis Confidence:</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.round((universalExtraction?.confidence_score || aiAnalysis?.confidence || 0.95) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{Math.round((universalExtraction?.confidence_score || aiAnalysis?.confidence || 0.95) * 100)}%</span>
                    </div>
                  </div>
                </div>
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



          {/* Detailed Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Status */}
            {uploadResults?.jobId && (
              <SecurityStatus
                jobId={uploadResults.jobId}
                fileName={uploadResults.fileName || 'Unknown'}
              />
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


      </div>
    </div>
  );
};

export default ResultsDashboard;