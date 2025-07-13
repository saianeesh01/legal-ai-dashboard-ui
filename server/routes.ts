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
        const newProgress = Math.min(job.progress + Math.random() * 20, 100);
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

      // Simulate AI response
      const mockAnswer = `Based on the legal document "${job.fileName}", here's what I found regarding: "${question}". This is a simulated response for demonstration purposes.`;
      
      const response = {
        answer: mockAnswer,
        context: [
          { page: 1, text: "Relevant section from page 1..." },
          { page: 3, text: "Additional context from page 3..." }
        ]
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
