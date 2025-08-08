import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import Index from "./pages/Index";
import Login from "./components/Login";
import About from "./components/About";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<'login' | 'about' | 'dashboard'>('login');

  const handleLogin = (username: string, password: string) => {
    console.log('Login attempt:', { username, password });
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleShowAbout = () => {
    setCurrentPage('about');
  };

  const handleBackToLogin = () => {
    setCurrentPage('login');
  };

  const handleGetStarted = () => {
    setCurrentPage('login');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('login');
  };

  if (currentPage === 'about') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <About onBackToLogin={handleBackToLogin} onGetStarted={handleGetStarted} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (!isAuthenticated || currentPage === 'login') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Login onLogin={handleLogin} onShowAbout={handleShowAbout} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Index onLogout={handleLogout} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
