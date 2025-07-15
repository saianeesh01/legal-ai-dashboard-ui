import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, Clock, FileText, Calendar } from "lucide-react";

interface QueryFormProps {
  onQuery: (query: string) => void;
  isLoading: boolean;
}

const QueryForm = ({ onQuery, isLoading }: QueryFormProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onQuery(query.trim());
      setQuery("");
    }
  };

  const suggestedQueries = [
    {
      icon: Clock,
      text: "What are the key deadlines in this document?",
      category: "Deadlines"
    },
    {
      icon: FileText,
      text: "Summarize the main terms and conditions",
      category: "Summary"
    },
    {
      icon: Calendar,
      text: "What renewal options are available?",
      category: "Terms"
    }
  ];

  const handleSuggestedQuery = (suggestedText: string) => {
    setQuery(suggestedText);
  };

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <span>Ask Questions</span>
        </CardTitle>
        <CardDescription>
          Ask specific questions about your document to get detailed insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Suggested Queries */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuery(suggestion.text)}
                className="text-xs hover:bg-accent/10 transition-smooth"
                disabled={isLoading}
              >
                <suggestion.icon className="h-3 w-3 mr-1" />
                {suggestion.text}
              </Button>
            ))}
          </div>
        </div>

        {/* Query Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Ask me anything about your document... e.g., 'What are the payment terms?' or 'Explain the termination clause'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[100px] resize-none transition-smooth focus:ring-2 focus:ring-accent/20"
              disabled={isLoading}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Be specific for better results</span>
              <span>{query.length}/500</span>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={!query.trim() || isLoading}
            className="w-full bg-gradient-accent hover:bg-accent/90 transition-smooth text-[#000000]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Ask Question
              </>
            )}
          </Button>
        </form>

        {/* Tips */}
        <div className="bg-accent/5 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-accent" />
            Tips for better results:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-6">
            <li>• Ask specific questions about sections, clauses, or terms</li>
            <li>• Request explanations of legal language or complex provisions</li>
            <li>• Ask about deadlines, obligations, or key dates</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default QueryForm;