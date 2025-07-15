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
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-accent-foreground h-10 px-4 py-2 transition-smooth hover:bg-muted text-[#372a2a]"
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