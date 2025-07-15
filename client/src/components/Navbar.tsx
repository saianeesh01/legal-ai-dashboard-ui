import { Button } from "@/components/ui/button";
import { FileText, Upload, Search, Scale } from "lucide-react";

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

const Navbar = ({ currentView, setCurrentView }: NavbarProps) => {
  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-primary rounded-lg p-2">
              <Scale className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">LegalAI</h1>
              <p className="text-xs text-muted-foreground">Document Analysis</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-2">
            <Button
              variant={currentView === "upload" ? "default" : "ghost"}
              onClick={() => setCurrentView("upload")}
              className={`transition-smooth ${
                currentView === "upload" 
                  ? "bg-gradient-primary hover:bg-primary-hover" 
                  : "hover:bg-muted"
              }`}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            
            <Button
              variant={currentView === "search" ? "default" : "ghost"}
              onClick={() => setCurrentView("search")}
              className={`transition-smooth ${
                currentView === "search" 
                  ? "bg-gradient-primary hover:bg-primary-hover" 
                  : "hover:bg-muted"
              }`}
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>

            <Button
              variant={currentView === "results" ? "default" : "ghost"}
              onClick={() => setCurrentView("results")}
              className={`transition-smooth ${
                currentView === "results" 
                  ? "bg-gradient-primary hover:bg-primary-hover" 
                  : "hover:bg-muted"
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Results
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;