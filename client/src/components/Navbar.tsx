import { Button } from "@/components/ui/button";
import { FileText, Upload, Search, Scale, LogOut } from "lucide-react";

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onLogout: () => void;
}

const Navbar = ({ currentView, setCurrentView, onLogout }: NavbarProps) => {
  return (
    <nav className="sticky top-0 z-50 bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-2xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 shadow-lg border border-white/20">
              <Scale className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">LegalAI</h1>
              <p className="text-xs text-blue-200">Document Analysis</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-2">
            <Button
              variant={currentView === "upload" ? "default" : "ghost"}
              onClick={() => setCurrentView("upload")}
              className={`transition-all duration-300 ${currentView === "upload"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                  : "text-blue-200 hover:text-white hover:bg-white/10 border border-white/20"
                }`}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>

            <Button
              variant={currentView === "search" ? "default" : "ghost"}
              onClick={() => setCurrentView("search")}
              className={`transition-all duration-300 ${currentView === "search"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                  : "text-blue-200 hover:text-white hover:bg-white/10 border border-white/20"
                }`}
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>

            <Button
              variant={currentView === "results" ? "default" : "ghost"}
              onClick={() => setCurrentView("results")}
              className={`transition-all duration-300 ${currentView === "results"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                  : "text-blue-200 hover:text-white hover:bg-white/10 border border-white/20"
                }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Results
            </Button>

            {/* Logout Button */}
            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-red-500/30 transition-all duration-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;