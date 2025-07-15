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
  Shield
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { queryDocument, analyzeDocument, getAllDocuments, ApiError } from "@/lib/api";
import QueryForm from "./QueryForm";
import SecurityStatus from "./SecurityStatus";
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
      } else if (existingDoc?.status === "DONE") {
        // Trigger new analysis for completed document
        performAIAnalysis();
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
      
      toast({
        title: "Query complete",
        description: "Found relevant information in your document.",
      });
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

  return (
    <div className="space-y-6">
      {/* Enhanced AI Analysis */}
      {aiAnalysis && !searchMode && (
        <div className="space-y-6">
          {/* Main Analysis Card */}
          <Card className="shadow-elegant animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>AI Analysis Results</span>
                  {aiAnalysis.verdict && (
                    <Badge 
                      variant="default"
                      className={getDocumentTypeBadgeClass(aiAnalysis.verdict)}
                    >
                      {getDocumentTypeLabel(aiAnalysis.verdict)}
                    </Badge>
                  )}
                  {aiAnalysis.confidence && (
                    <ConfidenceScoreHelp variant="minimal" side="bottom">
                      <Badge variant="outline" className="cursor-help">
                        {Math.round(aiAnalysis.confidence * 100)}% confidence
                      </Badge>
                    </ConfidenceScoreHelp>
                  )}
                </div>
                <DocumentAnalysisHelp variant="default" side="left" />
              </CardTitle>
              <CardDescription>
                Comprehensive AI-powered document analysis and insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Expanded Summary */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  Expanded Summary
                </h4>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                    {aiAnalysis.summary}
                  </p>
                </div>
              </div>

              {/* Evidence and Reasoning */}
              {aiAnalysis.evidence && aiAnalysis.evidence.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <Search className="h-4 w-4 mr-2 text-primary" />
                      Classification Evidence
                    </div>
                    <EvidenceHelp variant="minimal" side="left" />
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border">
                    <p className="text-sm text-muted-foreground mb-3 font-medium">
                      {aiAnalysis.reasoning}
                    </p>
                    <div className="space-y-2">
                      {aiAnalysis.evidence.map((evidence, index) => (
                        <div key={index} className="flex items-start space-x-3 p-2 bg-white dark:bg-slate-800 rounded border">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm">{evidence}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Key Findings */}
              {aiAnalysis.keyFindings && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Target className="h-4 w-4 mr-2 text-accent" />
                    Key Findings
                  </h4>
                  <div className="grid gap-2">
                    {aiAnalysis.keyFindings.map((finding, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
              <Card className="shadow-elegant animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>Critical Dates</span>
                    </div>
                    <TimelineHelp variant="minimal" side="left" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiAnalysis.criticalDates.map((date, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 rounded-md bg-amber-50 dark:bg-amber-950/20">
                        <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm font-medium">{date}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Terms */}
            {aiAnalysis.financialTerms && (
              <Card className="shadow-elegant animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span>Financial Terms</span>
                    </div>
                    <FinancialTermsHelp variant="minimal" side="left" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiAnalysis.financialTerms.map((term, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 rounded-md bg-green-50 dark:bg-green-950/20">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm font-medium">{term}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compliance Requirements */}
            {aiAnalysis.complianceRequirements && (
              <Card className="shadow-elegant animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span>Compliance Requirements</span>
                    </div>
                    <ComplianceHelp variant="minimal" side="left" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiAnalysis.complianceRequirements.map((req, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 rounded-md bg-purple-50 dark:bg-purple-950/20">
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm font-medium">{req}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Improvements */}
            {aiAnalysis.improvements && aiAnalysis.improvements.length > 0 && (
              <Card className="shadow-elegant animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="h-4 w-4 text-accent" />
                      <span>Suggestions to Improve</span>
                    </div>
                    <LegalImprovementsHelp variant="minimal" side="left" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    {aiAnalysis.improvements.map((improvement, index) => (
                      <li key={index} className="text-sm">{improvement}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommended Toolkit */}
            {aiAnalysis.toolkit && aiAnalysis.toolkit.length > 0 && (
              <Card className="shadow-elegant animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <Target className="h-4 w-4 text-primary" />
                    <span>Recommended Toolkit</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    {aiAnalysis.toolkit.map((tool, index) => (
                      <li key={index} className="text-sm">{tool}</li>
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
        <Card className="shadow-elegant animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span>Document Processed</span>
            </CardTitle>
            <CardDescription>
              Successfully analyzed {uploadResults.fileName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{uploadResults.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadResults.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-success/10 text-success">
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

      {/* Query Results */}
      {queryResults && (
        <Card className="shadow-elegant animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span>Query Response</span>
              {queryResults.confidence && (
                <Badge variant="outline">
                  {Math.round(queryResults.confidence * 100)}% confidence
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              AI-powered answer to your question
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {queryResults.answer}
              </div>
            </div>
          </CardContent>
        </Card>
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
                {queryResults.context.map((item, index) => (
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
        {!searchMode && aiAnalysis?.criticalDates && (
          <Card className="shadow-elegant animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Timeline Overview</span>
              </CardTitle>
              <CardDescription>
                Key dates and deadlines from your document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiAnalysis.criticalDates.map((date, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-3 h-3 bg-primary rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate">
                            {date}
                          </p>
                          <div className="flex items-center space-x-2">
                            {date.includes('Launch') && (
                              <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                Launch
                              </Badge>
                            )}
                            {date.includes('Payment') && (
                              <Badge variant="outline" className="text-xs">
                                Payment
                              </Badge>
                            )}
                            {date.includes('Review') && (
                              <Badge variant="secondary" className="text-xs">
                                Review
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < aiAnalysis.criticalDates.length - 1 && (
                      <div className="absolute left-1.5 top-6 w-0.5 h-4 bg-border"></div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Timeline Items:</span>
                  <span className="font-medium">{aiAnalysis.criticalDates.length} identified</span>
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