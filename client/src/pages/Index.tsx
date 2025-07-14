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
import { FileText, Upload, Search, Calendar, Brain, CheckCircle, AlertCircle, Trash2, Filter, X } from "lucide-react";
import { getAllDocuments, deleteDocument } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [currentView, setCurrentView] = useState("upload");
  const [queryResults, setQueryResults] = useState(null);
  const [uploadResults, setUploadResults] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "proposal" | "non-proposal">("all");
  
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

  const handleUploadComplete = (results) => {
    setUploadResults(results);
    setCurrentView("results");
    // Refetch documents when a new upload completes
    refetchDocuments();
  };

  const handleQueryResults = (results) => {
    setQueryResults(results);
  };

  const handleDocumentClick = (document) => {
    // Set the selected document as current upload results and switch to results view
    setUploadResults({
      jobId: document.id,
      fileName: document.fileName,
      fileSize: document.fileSize,
      processedAt: document.processedAt || document.createdAt,
    });
    setQueryResults(null); // Clear previous query results
    setCurrentView("results");
  };

  const handleDeleteClick = (e: React.MouseEvent, document: any) => {
    e.stopPropagation(); // Prevent triggering document click
    setDocumentToDelete(document);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete.id);
    }
  };

  // Filter documents based on search query and type
  const filteredDocuments = documents?.filter((document) => {
    const matchesSearch = document.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || 
      (filterType === "proposal" && document.aiAnalysis?.verdict === "proposal") ||
      (filterType === "non-proposal" && document.aiAnalysis?.verdict === "non-proposal");
    
    return matchesSearch && matchesType;
  }) || [];

  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="container mx-auto px-4 py-8">
        {currentView === "upload" && (
          <div className="animate-fade-in">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-primary rounded-xl p-4 shadow-glow">
                  <FileText className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                Legal Document Analysis
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Upload your legal documents and get AI-powered insights, deadline tracking, and intelligent search capabilities.
              </p>
            </div>
            
            <FileUploader onUploadComplete={handleUploadComplete} />
          </div>
        )}

        {currentView === "results" && (
          <div className="animate-fade-in">
            <ResultsDashboard 
              uploadResults={uploadResults}
              queryResults={queryResults}
              onQueryResults={handleQueryResults}
            />
          </div>
        )}

        {currentView === "search" && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-primary rounded-xl p-4 shadow-glow">
                  <Search className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                Document Library
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Browse your uploaded documents and their AI analysis results. Click any document to view details.
              </p>
            </div>

            {/* Search and Filter Controls */}
            {documents && documents.length > 0 && (
              <div className="mb-8">
                <Card className="shadow-elegant">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Search Input */}
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search documents by name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-4"
                        />
                      </div>
                      
                      {/* Filter Select */}
                      <div className="sm:w-48">
                        <Select value={filterType} onValueChange={(value: "all" | "proposal" | "non-proposal") => setFilterType(value)}>
                          <SelectTrigger className="w-full">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filter by type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Documents</SelectItem>
                            <SelectItem value="proposal">Proposals Only</SelectItem>
                            <SelectItem value="non-proposal">Non-Proposals Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Clear Filters Button */}
                      {(searchQuery || filterType !== "all") && (
                        <Button 
                          variant="outline" 
                          size="default"
                          onClick={clearFilters}
                          className="sm:w-auto"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear
                        </Button>
                      )}
                    </div>
                    
                    {/* Results Summary */}
                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Showing {filteredDocuments.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
                      </span>
                      {(searchQuery || filterType !== "all") && (
                        <span className="text-xs">
                          {searchQuery && `"${searchQuery}"`}
                          {searchQuery && filterType !== "all" && " • "}
                          {filterType !== "all" && `${filterType === "proposal" ? "Proposals" : "Non-Proposals"} only`}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!documents || documents.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-card rounded-xl p-8 shadow-elegant max-w-md mx-auto">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No Documents Yet</h2>
                  <p className="text-muted-foreground mb-6">
                    Upload your first document to start building your library.
                  </p>
                  <Button 
                    onClick={() => setCurrentView("upload")}
                    className="bg-gradient-primary hover:bg-primary-hover transition-smooth"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-card rounded-xl p-8 shadow-elegant max-w-md mx-auto">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No Documents Found</h2>
                  <p className="text-muted-foreground mb-6">
                    No documents match your current search criteria. Try adjusting your search terms or filters.
                  </p>
                  <Button 
                    onClick={clearFilters}
                    variant="outline"
                    className="mr-2"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                  <Button 
                    onClick={() => setCurrentView("upload")}
                    className="bg-gradient-primary hover:bg-primary-hover transition-smooth"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((document) => (
                  <Card 
                    key={document.id}
                    className="shadow-elegant hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
                    onClick={() => handleDocumentClick(document)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <Badge 
                            variant={document.aiAnalysis?.verdict === "proposal" ? "default" : "secondary"}
                            className={`${
                              document.aiAnalysis?.verdict === "proposal" 
                                ? "bg-green-100 text-green-800 border-green-200" 
                                : "bg-red-100 text-red-800 border-red-200"
                            }`}
                          >
                            {document.aiAnalysis?.verdict === "proposal" ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Proposal
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Non-Proposal
                              </>
                            )}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          {document.aiAnalysis && (
                            <div className="flex items-center space-x-1">
                              <Brain className="h-4 w-4 text-accent" />
                              <span className="text-xs text-muted-foreground">
                                {Math.round(document.aiAnalysis.confidence * 100)}%
                              </span>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleDeleteClick(e, document)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{document.fileName}</CardTitle>
                      <CardDescription className="flex items-center space-x-4 text-sm">
                        <span>{(document.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(document.createdAt).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    {document.aiAnalysis?.summary && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-3">
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.fileName}"? This action cannot be undone.
            </AlertDialogDescription>
            {documentToDelete && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{documentToDelete.fileName}</span>
                </div>
                <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
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
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
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
