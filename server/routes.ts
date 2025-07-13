import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // File upload endpoint
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Simulate file processing with a job ID
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store the job in memory (in a real app, this would be in a database)
      await storage.createJob({
        id: jobId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        status: "PROCESSING",
        progress: 0,
        createdAt: new Date().toISOString()
      });

      res.json({ job_id: jobId });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Job status polling endpoint
  app.get("/api/status/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Simulate progress
      if (job.status === "PROCESSING") {
        const newProgress = Math.min(job.progress + Math.floor(Math.random() * 20), 100);
        const newStatus = newProgress >= 100 ? "DONE" : "PROCESSING";
        
        await storage.updateJob(jobId, { 
          progress: newProgress, 
          status: newStatus,
          processedAt: newStatus === "DONE" ? new Date().toISOString() : undefined
        });
        
        res.json({ pct: newProgress, state: newStatus });
      } else {
        res.json({ pct: job.progress, state: job.status });
      }
    } catch (error) {
      console.error("Status check error:", error);
      res.status(500).json({ error: "Status check failed" });
    }
  });

  // Document analysis endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { job_id } = req.body;
      
      if (!job_id) {
        return res.status(400).json({ error: "Missing job_id" });
      }

      const job = await storage.getJob(job_id);
      if (!job || job.status !== "DONE") {
        return res.status(400).json({ error: "Document not ready for analysis" });
      }

      // Check if document is a proposal based on filename and simulate analysis
      const isProposal = /proposal|rfp|request for proposal|bid|tender/i.test(job.fileName);
      
      const analysisResult = {
        verdict: isProposal ? "proposal" : "non-proposal",
        confidence: isProposal ? 0.85 : 0.75,
        summary: isProposal 
          ? "• Document appears to be a proposal or RFP-related document\n• Contains structured information typical of proposals\n• Includes standard proposal elements and formatting"
          : "• Document does not appear to be a proposal document\n• May be a contract, agreement, or informational document\n• Consider restructuring if proposal format is desired",
        suggestions: isProposal 
          ? [
              "Add clear executive summary section",
              "Include detailed timeline and milestones", 
              "Strengthen budget and cost breakdown",
              "Add team qualifications and experience",
              "Include risk assessment and mitigation"
            ]
          : [
              "Add proposal-specific sections like objectives",
              "Include methodology and approach sections",
              "Add deliverables and timeline information",
              "Include budget and resource requirements",
              "Add evaluation criteria and success metrics"
            ]
      };

      res.json(analysisResult);
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  // Document query endpoint
  app.post("/api/query", async (req, res) => {
    try {
      const { job_id, question } = req.body;
      
      if (!job_id || !question) {
        return res.status(400).json({ error: "Missing job_id or question" });
      }

      const job = await storage.getJob(job_id);
      if (!job || job.status !== "DONE") {
        return res.status(400).json({ error: "Document not ready for querying" });
      }

      // Enhanced mock responses based on common legal document questions
      const responses = {
        deadlines: `Based on analysis of "${job.fileName}", here are the key deadlines:\n\n• Contract renewal notice: 90 days prior to expiration\n• Annual review: Every 12 months from signing\n• Payment terms: Net 30 days from invoice date\n• Termination notice: 60 days written notice required`,
        terms: `The main terms and conditions in "${job.fileName}" include:\n\n• Primary obligations and responsibilities of each party\n• Payment schedules and financial arrangements\n• Duration and renewal provisions\n• Termination and cancellation clauses\n• Dispute resolution procedures`,
        renewal: `Renewal options in "${job.fileName}":\n\n• Automatic renewal clause with 90-day notice requirement\n• Option periods: Typically 1-2 year extensions\n• Rate adjustments: May include CPI or fixed percentage increases\n• Modification rights: Changes require mutual written consent`,
        default: `Regarding your question about "${question}" in document "${job.fileName}":\n\nI've analyzed the document content and found relevant information. This appears to be a ${job.fileName.includes('proposal') ? 'proposal document' : 'legal document'} with standard provisions. For specific details, please refer to the relevant sections of the original document.`
      };

      let answer = responses.default;
      if (question.toLowerCase().includes('deadline')) answer = responses.deadlines;
      else if (question.toLowerCase().includes('term')) answer = responses.terms;
      else if (question.toLowerCase().includes('renewal')) answer = responses.renewal;
      
      const response = {
        answer,
        context: [
          { page: 1, text: "Section 1: Overview and general provisions..." },
          { page: 3, text: "Section 3: Specific terms and conditions..." },
          { page: 5, text: "Section 5: Additional clauses and amendments..." }
        ],
        confidence: 0.78
      };

      res.json(response);
    } catch (error) {
      console.error("Query error:", error);
      res.status(500).json({ error: "Query failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
