import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { warmupModel, checkModelStatus } from "@/lib/warmup";

interface ModelWarmupProps {
  onWarmupComplete?: () => void;
}

export function ModelWarmup({ onWarmupComplete }: ModelWarmupProps) {
  const [isWarming, setIsWarming] = useState(false);
  const [modelStatus, setModelStatus] = useState<{
    ready: boolean;
    ollama_available: boolean;
    available_models: string[];
  }>({
    ready: false,
    ollama_available: false,
    available_models: []
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const status = await checkModelStatus();
    setModelStatus(status);
  };

  const handleWarmup = async () => {
    setIsWarming(true);
    
    try {
      const result = await warmupModel();
      
      if (result.success) {
        toast({
          title: "Model Ready!",
          description: "AI model is warmed up and ready for document analysis.",
        });
        
        await checkStatus(); // Refresh status
        onWarmupComplete?.();
      } else {
        toast({
          title: "Warmup Failed",
          description: result.error || "Could not warm up the AI model.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Warmup Error",
        description: "Failed to warm up the AI model.",
        variant: "destructive",
      });
    } finally {
      setIsWarming(false);
    }
  };

  const getStatusBadge = () => {
    if (!modelStatus.ollama_available) {
      return <Badge variant="destructive">Ollama Offline</Badge>;
    }
    if (modelStatus.ready) {
      return <Badge variant="default">Ready</Badge>;
    }
    return <Badge variant="secondary">Not Warmed</Badge>;
  };

  const getStatusIcon = () => {
    if (!modelStatus.ollama_available) {
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
    if (modelStatus.ready) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <Flame className="h-5 w-5 text-orange-500" />;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">AI Model Status</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Warm up the AI model for faster document analysis
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Ollama Service:</span>
            <span className={modelStatus.ollama_available ? "text-green-600" : "text-red-600"}>
              {modelStatus.ollama_available ? "Available" : "Offline"}
            </span>
          </div>
          
          {modelStatus.available_models.length > 0 && (
            <div className="flex justify-between">
              <span>Models:</span>
              <span>{modelStatus.available_models.length} available</span>
            </div>
          )}
        </div>

        {!modelStatus.ollama_available ? (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            <p className="font-medium mb-1">Start Ollama first:</p>
            <code className="text-xs">
              ollama serve<br/>
              ollama pull mistral:latest<br/>
              ollama run mistral:latest
            </code>
          </div>
        ) : (
          <Button 
            onClick={handleWarmup} 
            disabled={isWarming || modelStatus.ready}
            className="w-full"
          >
            {isWarming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Warming Up...
              </>
            ) : modelStatus.ready ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Model Ready
              </>
            ) : (
              <>
                <Flame className="mr-2 h-4 w-4" />
                Warm Up Model
              </>
            )}
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkStatus}
          className="w-full"
        >
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  );
}