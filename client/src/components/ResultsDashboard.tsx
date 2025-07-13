import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { 
  FileText, 
  Calendar, 
  Search, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  MessageCircle,
  ExternalLink
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { queryDocument, ApiError } from "@/lib/api";
import QueryForm from "./QueryForm";

interface ResultsDashboardProps {
  uploadResults?: any;
  queryResults?: any;
  onQueryResults: (results: any) => void;
  searchMode?: boolean;
}

const ResultsDashboard = ({ 
  uploadResults, 
  queryResults, 
  onQueryResults, 
  searchMode = false 
}: ResultsDashboardProps) => {
  const [isQuerying, setIsQuerying] = useState(false);

  // Mock data for demo purposes
  const mockAnswer = queryResults?.answer || `This legal document appears to be a commercial lease agreement with several key provisions:

**Key Findings:**
- Lease term: 5 years with option to renew
- Monthly rent: $8,500 with annual 3% increases
- Security deposit: $25,500 (3 months rent)
- Important deadlines identified for review

**Critical Deadlines:**
- Notice to renew must be given 90 days prior to expiration
- Rent review clause triggers in Year 3
- Insurance certificate renewal required annually

The document contains standard commercial lease provisions with some tenant-favorable modifications regarding maintenance responsibilities.`;

  const mockContext = queryResults?.context || [
    {
      page: 1,
      text: "LEASE AGREEMENT - This Commercial Lease Agreement is entered into on January 15, 2024, between LANDLORD PROPERTIES LLC and TENANT CORP..."
    },
    {
      page: 3,
      text: "TERM: The initial term of this lease shall be five (5) years, commencing on February 1, 2024, and ending on January 31, 2029..."
    },
    {
      page: 5,
      text: "RENT: Base rent shall be Eight Thousand Five Hundred Dollars ($8,500) per month, payable in advance on the first day of each month..."
    },
    {
      page: 8,
      text: "RENEWAL OPTION: Tenant shall have the right to renew this lease for one additional five-year term provided ninety (90) days written notice..."
    }
  ];

  // Mock deadline data for the chart
  const deadlineData = [
    { month: "Jan 2024", count: 2 },
    { month: "Feb 2024", count: 1 },
    { month: "Mar 2024", count: 4 },
    { month: "Apr 2024", count: 1 },
    { month: "May 2024", count: 3 },
    { month: "Jun 2024", count: 2 },
  ];

  const handleQuery = async (query: string) => {
    setIsQuerying(true);
    
    try {
      const results = await queryDocument(query);
      onQueryResults(results);
      
      toast({
        title: "Query complete",
        description: "Found relevant information in your document.",
      });
    } catch (error) {
      console.error("Query error:", error);
      
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : "There was an error processing your query.";
      
      toast({
        title: "Query failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Info */}
      {uploadResults && !searchMode && (
        <Card className="shadow-elegant animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span>Document Processed</span>
            </CardTitle>
            <CardDescription>
              Successfully analyzed {uploadResults.fileName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{uploadResults.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadResults.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-success/10 text-success">
                <Clock className="h-3 w-3 mr-1" />
                Processed
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Query Form */}
      <QueryForm onQuery={handleQuery} isLoading={isQuerying} />

      {/* AI Analysis Results */}
      {(queryResults || !searchMode) && (
        <Card className="shadow-elegant animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span>AI Analysis</span>
            </CardTitle>
            <CardDescription>
              Key insights and findings from your document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {mockAnswer}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Context Sources */}
        {(queryResults || !searchMode) && (
          <Card className="shadow-elegant animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-primary" />
                <span>Source References</span>
              </CardTitle>
              <CardDescription>
                Relevant sections from your document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockContext.map((item, index) => (
                  <div key={index} className="border-l-2 border-primary/20 pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        Page {item.page}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.text.substring(0, 150)}...
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deadline Chart */}
        <Card className="shadow-elegant animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Deadline Analysis</span>
            </CardTitle>
            <CardDescription>
              Important dates and deadlines found in your document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deadlineData}>
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                  />
                  <YAxis 
                    fontSize={12}
                  />
                  <Tooltip 
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Next Deadline:</span>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="font-medium">March 15, 2024</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Deadlines:</span>
                <span className="font-medium">13 identified</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResultsDashboard;