import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "../components/Navbar";
import FileUploader from "../components/FileUploader";
import ResultsDashboard from "../components/ResultsDashboard";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Search } from "lucide-react";

const Index = () => {
  const [currentView, setCurrentView] = useState("upload");
  const [queryResults, setQueryResults] = useState(null);
  const [uploadResults, setUploadResults] = useState(null);

  const handleUploadComplete = (results) => {
    setUploadResults(results);
    setCurrentView("results");
  };

  const handleQueryResults = (results) => {
    setQueryResults(results);
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

        {currentView === "search" && !uploadResults && (
          <div className="animate-fade-in text-center py-20">
            <div className="bg-card rounded-xl p-8 shadow-elegant max-w-md mx-auto">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Documents Uploaded</h2>
              <p className="text-muted-foreground mb-6">
                Upload a document first to start searching and asking questions.
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
    </div>
  );
};

export default Index;
