import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import FileUploader from "../components/FileUploader";

import ResultsDashboard from "../components/ResultsDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Upload, Search, Calendar, Brain, CheckCircle, AlertCircle, Trash2, Filter, X, Shield, ArrowLeft } from "lucide-react";
import { getAllDocuments, deleteDocument } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { SearchFilterHelp, DocumentTypesHelp, ConfidenceScoreHelp } from "@/components/ContextualHelpTooltip";

// Helper functions for multi-label document type display
const getDocumentTypeLabel = (verdict: string): string => {
  switch (verdict) {
    case 'proposal':
      return 'Proposal';
    case 'nta':
      return 'Notice to Appear (NTA)';
    case 'motion':
      return 'Motion/Brief';
    case 'ij_decision':
      return 'Immigration Judge Decision';
    case 'form':
      return 'Immigration Form';
    case 'country_report':
      return 'Country Report';
    case 'other':
      return 'Other Legal Document';
    case 'undetermined':
      return 'Undetermined';
    default:
      return verdict === 'proposal' ? 'Proposal' : 'Non-Proposal';
  }
};

const getDocumentTypeBadgeClass = (verdict: string): string => {
  switch (verdict) {
    case 'proposal':
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'nta':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'motion':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'ij_decision':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'form':
      return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'country_report':
      return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
    case 'other':
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    case 'undetermined':
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    default:
      return verdict === 'proposal' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300';
  }
};

const getDocumentTypeIcon = (verdict: string) => {
  switch (verdict) {
    case 'proposal':
      return <CheckCircle className="h-3 w-3 mr-1" />;
    case 'nta':
      return <AlertCircle className="h-3 w-3 mr-1" />;
    case 'motion':
      return <FileText className="h-3 w-3 mr-1" />;
    case 'ij_decision':
      return <CheckCircle className="h-3 w-3 mr-1" />;
    case 'form':
      return <FileText className="h-3 w-3 mr-1" />;
    case 'country_report':
      return <FileText className="h-3 w-3 mr-1" />;
    case 'other':
      return <FileText className="h-3 w-3 mr-1" />;
    case 'undetermined':
      return <AlertCircle className="h-3 w-3 mr-1" />;
    default:
      return verdict === 'proposal' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />;
  }
};

interface IndexProps {
  onLogout: () => void;
}

const Index = ({ onLogout }: IndexProps) => {
  const [currentView, setCurrentView] = useState("upload");
  const [queryResults, setQueryResults] = useState(null);
  const [uploadResults, setUploadResults] = useState<{
    jobId: string;
    fileName: string;
    fileSize: number;
    processedAt: string;
  } | null>(null);
  const [multipleUploadResults, setMultipleUploadResults] = useState<Array<{
    jobId: string;
    fileName: string;
    fileSize: number;
    processedAt: string;
  }>>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "proposal" | "nta" | "motion" | "ij_decision" | "form" | "country_report" | "other" | "undetermined">("all");

  const queryClient = useQueryClient();

  // Fetch all documents for search view
  const { data: documents, refetch: refetchDocuments } = useQuery({
    queryKey: ["documents"],
    queryFn: getAllDocuments,
    enabled: currentView === "search",
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Document deleted",
        description: "The document has been removed from your library.",
      });
      setShowDeleteDialog(false);
      setDocumentToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: "Could not delete the document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUploadComplete = (results: Array<{
    jobId: string;
    fileName: string;
    fileSize: number;
    processedAt: string;
  }>) => {
    // Store all upload results for display
    setMultipleUploadResults(results);

    // Set the first result as the primary upload result for backward compatibility
    if (results.length > 0) {
      setUploadResults(results[0]);
    }

    setCurrentView("results");
    // Refetch documents when new uploads complete
    refetchDocuments();
  };

  const handleQueryResults = (results: any) => {
    setQueryResults(results);
  };

  const handleDocumentClick = (document: any) => {
    // Set the selected document as current upload results and switch to results view
    setUploadResults({
      jobId: document.id as any,
      fileName: document.fileName,
      fileSize: document.fileSize,
      processedAt: document.processedAt || document.createdAt,
    } as any);
    setQueryResults(null); // Clear previous query results
    setCurrentView("results");
  };

  const handleDeleteClick = (e: React.MouseEvent, document: any) => {
    e.stopPropagation(); // Prevent triggering document click
    setDocumentToDelete(document);
    setShowDeleteDialog(true);
  };

  const handleViewRedactedFile = async (e: React.MouseEvent, document: any) => {
    e.stopPropagation(); // Prevent triggering document click

    try {
      // Open the redacted PDF in a new window
      const pdfUrl = `/api/documents/${document.id}/redacted-pdf`;
      const newWindow = window.open(pdfUrl, '_blank', 'width=900,height=700,scrollbars=yes');

      if (!newWindow) {
        // Fallback: download the PDF if popup blocked
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `REDACTED_${document.fileName}`;
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

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete.id);
    }
  };

  // Filter documents based on search query and type
  const filteredDocuments = documents?.filter((document) => {
    const matchesSearch = document.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || document.aiAnalysis?.verdict === filterType;

    return matchesSearch && matchesType;
  }) || [];

  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} onLogout={onLogout} />
      <main className="container mx-auto px-4 py-8">
        {currentView === "upload" && (
          <div className="animate-fade-in">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
                  <FileText className="h-12 w-12 text-blue-300" />
                </div>
              </div>
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent">
                Legal Document Analysis
              </h1>
              <p className="text-xl text-blue-200 max-w-3xl mx-auto leading-relaxed">
                Upload your legal documents and get AI-powered insights, deadline tracking, and intelligent search capabilities.
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
              <FileUploader onUploadComplete={handleUploadComplete} />
              

            </div>
          </div>
        )}

        {currentView === "results" && (
          <div className="animate-fade-in">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
                  <FileText className="h-12 w-12 text-blue-300" />
                </div>
              </div>
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent">
                Upload Results
              </h1>
              <p className="text-xl text-blue-200 max-w-3xl mx-auto leading-relaxed">
                {multipleUploadResults.length > 1
                  ? `${multipleUploadResults.length} documents processed successfully. Click on any document to view detailed analysis.`
                  : "Document processed successfully. Click to view detailed analysis."
                }
              </p>
            </div>

            <div className="max-w-7xl mx-auto">
              {multipleUploadResults.length > 1 ? (
                // Multiple documents - use grid layout like search view
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {multipleUploadResults.map((result, index) => (
                    <Card
                      key={result.jobId}
                      className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer hover:scale-105 hover:bg-white/15"
                      onClick={() => {
                        setUploadResults(result);
                        setCurrentView("results");
                      }}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-blue-300" />
                            <DocumentTypesHelp variant="minimal" side="bottom">
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 border-green-200 cursor-help"
                              >
                                📄 Document
                              </Badge>
                            </DocumentTypesHelp>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <Brain className="h-4 w-4 text-blue-300" />
                              <span className="text-xs text-blue-200">
                                Processing...
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-300 hover:text-blue-200 hover:bg-white/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle view redacted file
                              }}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-white text-lg mb-1 truncate">
                              {result.fileName}
                            </h3>
                            <p className="text-sm text-blue-200">
                              {(result.fileSize / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-xs text-blue-300">
                            <span>Processed {new Date(result.processedAt).toLocaleString()}</span>
                            <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                              Complete
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // Single document - use full width layout
                <div className="max-w-4xl mx-auto">
                  <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-500/20 rounded-full p-2">
                            <CheckCircle className="h-6 w-6 text-green-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-white">{uploadResults?.fileName}</CardTitle>
                            <CardDescription className="text-blue-200">
                              {((uploadResults?.fileSize || 0) / (1024 * 1024)).toFixed(2)} MB • Processed {uploadResults?.processedAt ? new Date(uploadResults.processedAt).toLocaleString() : 'Now'}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
                          Complete
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <ResultsDashboard
                        uploadResults={uploadResults}
                        queryResults={queryResults}
                        onQueryResults={handleQueryResults}
                        searchMode={false}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === "search" && (
          <div className="animate-fade-in">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
                  <Search className="h-12 w-12 text-blue-300" />
                </div>
              </div>
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent">
                Document Library
              </h1>
              <p className="text-xl text-blue-200 max-w-3xl mx-auto leading-relaxed">
                Browse your uploaded documents and their AI analysis results. Click any document to view details.
              </p>
            </div>

            {/* Search and Filter Controls */}
            {documents && documents.length > 0 && (
              <div className="mb-8 max-w-6xl mx-auto">
                <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
                  <CardContent className="pt-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-white">Search & Filter Documents</h3>
                      <SearchFilterHelp variant="default" side="left" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Search Input */}
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
                        <Input
                          type="text"
                          placeholder="Search documents by name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-4 bg-white/10 border-white/20 text-white placeholder-blue-300 focus:bg-white/20 focus:border-blue-400"
                        />
                      </div>

                      {/* Filter Select */}
                      <div className="sm:w-48 relative">
                        <Select value={filterType} onValueChange={(value: "all" | "proposal" | "nta" | "motion" | "ij_decision" | "form" | "country_report" | "other" | "undetermined") => setFilterType(value)}>
                          <SelectTrigger className="w-full bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-blue-400">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filter by type" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/20">
                            <SelectItem value="all">All Documents</SelectItem>
                            <SelectItem value="proposal">📄 Proposals</SelectItem>
                            <SelectItem value="nta">⚖️ Notice to Appear (NTA)</SelectItem>
                            <SelectItem value="motion">📋 Motions/Briefs</SelectItem>
                            <SelectItem value="ij_decision">⚖️ Immigration Judge Decisions</SelectItem>
                            <SelectItem value="form">📝 Immigration Forms</SelectItem>
                            <SelectItem value="country_report">🌍 Country Reports</SelectItem>
                            <SelectItem value="other">📄 Other Legal Documents</SelectItem>
                            <SelectItem value="undetermined">❓ Undetermined</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Clear Filters Button */}
                      {(searchQuery || filterType !== "all") && (
                        <Button
                          variant="outline"
                          size="default"
                          onClick={clearFilters}
                          className="sm:w-auto border-white/20 text-white hover:bg-white/10"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear
                        </Button>
                      )}
                    </div>

                    {/* Results Summary */}
                    <div className="mt-6 flex items-center justify-between text-sm text-blue-200">
                      <span>
                        Showing {filteredDocuments.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
                      </span>
                      {(searchQuery || filterType !== "all") && (
                        <span className="text-xs">
                          {searchQuery && `"${searchQuery}"`}
                          {searchQuery && filterType !== "all" && " • "}
                          {filterType !== "all" && `${getDocumentTypeLabel(filterType)} only`}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!documents || documents.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 shadow-2xl border border-white/20 max-w-md mx-auto">
                  <FileText className="h-16 w-16 text-blue-300 mx-auto mb-6" />
                  <h2 className="text-2xl font-semibold mb-4 text-white">No Documents Yet</h2>
                  <p className="text-blue-200 mb-8 leading-relaxed">
                    Upload your first document to start building your library.
                  </p>
                  <Button
                    onClick={() => setCurrentView("upload")}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 shadow-2xl border border-white/20 max-w-md mx-auto">
                  <Search className="h-16 w-16 text-blue-300 mx-auto mb-6" />
                  <h2 className="text-2xl font-semibold mb-4 text-white">No Documents Found</h2>
                  <p className="text-blue-200 mb-8 leading-relaxed">
                    No documents match your current search criteria. Try adjusting your search terms or filters.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                    <Button
                      onClick={() => setCurrentView("upload")}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {filteredDocuments.map((document) => (
                  <Card
                    key={document.id}
                    className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer hover:scale-105 hover:bg-white/15"
                    onClick={() => handleDocumentClick(document)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-blue-300" />
                          <DocumentTypesHelp variant="minimal" side="bottom">
                            <Badge
                              variant="outline"
                              className={`${getDocumentTypeBadgeClass(document.aiAnalysis?.verdict || 'undetermined')} cursor-help`}
                            >
                              {getDocumentTypeIcon(document.aiAnalysis?.verdict || 'undetermined')}
                              {getDocumentTypeLabel(document.aiAnalysis?.verdict || 'undetermined')}
                            </Badge>
                          </DocumentTypesHelp>
                        </div>
                        <div className="flex items-center space-x-2">
                          {document.aiAnalysis && (
                            <div className="flex items-center space-x-1">
                              <ConfidenceScoreHelp variant="minimal" side="bottom">
                                <div className="flex items-center space-x-1 cursor-help">
                                  <Brain className="h-4 w-4 text-blue-300" />
                                  <span className="text-xs text-blue-200">
                                    {Math.round(document.aiAnalysis.confidence * 100)}%
                                  </span>
                                </div>
                              </ConfidenceScoreHelp>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-300 hover:text-blue-200 hover:bg-blue-500/20"
                            onClick={(e) => handleViewRedactedFile(e, document)}
                            title="View Redacted File"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            onClick={(e) => handleDeleteClick(e, document)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-lg line-clamp-2 text-white">{document.fileName}</CardTitle>
                      <CardDescription className="flex items-center space-x-4 text-sm text-blue-200">
                        <span>{(document.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(document.createdAt).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    {document.aiAnalysis?.summary && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-blue-200 line-clamp-3">
                          {document.aiAnalysis.summary.replace(/•\s*/g, '').split('\n')[0]}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === "search" && uploadResults && (
          <div className="animate-fade-in">
            <div className="mb-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadResults(null);
                  setQueryResults(null);
                }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Search
              </Button>
              <div className="text-sm text-blue-200">
                Viewing document from search results
              </div>
            </div>
            <ResultsDashboard
              uploadResults={uploadResults}
              queryResults={queryResults}
              onQueryResults={handleQueryResults}
              searchMode={true}
            />
          </div>
        )}
      </main>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-800 border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Document</AlertDialogTitle>
            <AlertDialogDescription className="text-blue-200">
              Are you sure you want to delete "{documentToDelete?.fileName}"? This action cannot be undone.
            </AlertDialogDescription>
            {documentToDelete && (
              <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-2 text-sm">
                  <FileText className="h-4 w-4 text-blue-300" />
                  <span className="font-medium text-white">{documentToDelete.fileName}</span>
                </div>
                <div className="flex items-center space-x-4 mt-1 text-xs text-blue-200">
                  <span>{(documentToDelete.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(documentToDelete.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setDocumentToDelete(null);
              }}
              disabled={deleteMutation.isPending}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
