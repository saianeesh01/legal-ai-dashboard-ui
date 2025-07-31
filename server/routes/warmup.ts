import type { Express } from "express";
import fetch from 'node-fetch';

export function setupWarmupRoutes(app: Express) {
  
  // Warm up AI model endpoint
  app.post("/api/warmup", async (req, res) => {
    try {
      console.log("🔥 Initiating model warmup...");
      
      // Docker-aware AI service URL
      const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 
        (process.env.NODE_ENV === 'production' ? "http://ai_service:5001" : "http://localhost:5001");
      
      // Call the AI service warmup endpoint
      const response = await fetch(`${AI_SERVICE_URL}/warmup/auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI service warmup failed:", errorText);
        return res.status(500).json({
          error: "Model warmup failed",
          details: errorText
        });
      }
      
      const result = await response.json();
      console.log("✅ Model warmup completed successfully");
      
      res.json({
        success: true,
        message: "Legal document analysis model is warmed up and ready",
        ...result
      });
      
    } catch (error) {
      console.error("Warmup route error:", error);
      res.status(500).json({
        error: "Failed to warm up model",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Check if model is ready
  app.get("/api/warmup/status", async (req, res) => {
    try {
      // Docker-aware AI service URL
      const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 
        (process.env.NODE_ENV === 'production' ? "http://ai_service:5001" : "http://localhost:5001");
      
      const response = await fetch(`${AI_SERVICE_URL}/health`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        return res.status(503).json({
          ready: false,
          error: "AI service not available"
        });
      }
      
      const healthData = await response.json();
      
      res.json({
        ready: healthData.ollama_available || false,
        ai_service_status: healthData.status,
        ollama_available: healthData.ollama_available,
        available_models: healthData.available_models || []
      });
      
    } catch (error) {
      res.status(503).json({
        ready: false,
        error: "Cannot connect to AI service"
      });
    }
  });
}