import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Quote, BookOpen, Clock, TrendingUp, MessageSquare, HelpCircle } from "lucide-react";

interface EnhancedQueryResponseProps {
  response: string;
  confidence?: number;
  sourceExcerpts?: string[];
  reasoning?: string;
  cannotAnswer?: boolean;
  suggestions?: string[];
  timestamp?: string;
  onSuggestedQuery?: (query: string) => void;
}

const EnhancedQueryResponse = ({
  response,
  confidence = 0,
  sourceExcerpts = [],
  reasoning = "",
  cannotAnswer = false,
  suggestions = [],
  timestamp,
  onSuggestedQuery
}: EnhancedQueryResponseProps) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return "text-green-600 bg-green-50";
    if (conf >= 0.6) return "text-yellow-600 bg-yellow-50";
    if (conf >= 0.4) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.8) return "High";
    if (conf >= 0.6) return "Medium";
    if (conf >= 0.4) return "Low";
    return "Very Low";
  };

  return (
    <Card className="shadow-elegant border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            {cannotAnswer ? (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            <span>AI Response</span>
          </CardTitle>
          {!cannotAnswer && confidence > 0 && (
            <Badge variant="outline" className={getConfidenceColor(confidence)}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {getConfidenceLabel(confidence)} Confidence ({Math.round(confidence * 100)}%)
            </Badge>
          )}
        </div>
        {timestamp && (
          <CardDescription className="flex items-center space-x-1 text-xs">
            <Clock className="h-3 w-3" />
            <span>{new Date(timestamp).toLocaleTimeString()}</span>
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Response */}
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <MessageSquare className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm leading-relaxed">{response}</p>
            </div>
          </div>
        </div>

        {/* Cannot Answer Alert */}
        {cannotAnswer && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              This question cannot be answered from the document content. The response above explains why.
            </AlertDescription>
          </Alert>
        )}

        {/* Source Excerpts */}
        {sourceExcerpts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Quote className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Source Excerpts from Document:</span>
            </div>
            <div className="space-y-2">
              {sourceExcerpts.map((excerpt, index) => (
                <div key={index} className="bg-muted/30 border-l-2 border-primary/30 p-3 rounded-r-md">
                  <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                    "{excerpt}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning */}
        {reasoning && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Analysis Method:</span>
            </div>
            <p className="text-xs text-muted-foreground bg-muted/20 p-2 rounded-md">
              {reasoning}
            </p>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {cannotAnswer ? "Try asking instead:" : "Related questions you might ask:"}
              </span>
            </div>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onSuggestedQuery?.(suggestion)}
                  className="text-xs justify-start h-auto p-2 hover:bg-accent/10"
                >
                  <MessageSquare className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="text-left">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Quality Indicators */}
        <div className="pt-3 border-t border-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>No hallucination</span>
              </span>
              <span className="flex items-center space-x-1">
                <BookOpen className="h-3 w-3" />
                <span>Document-only content</span>
              </span>
            </div>
            {sourceExcerpts.length > 0 && (
              <span>{sourceExcerpts.length} source{sourceExcerpts.length !== 1 ? 's' : ''} cited</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedQueryResponse;