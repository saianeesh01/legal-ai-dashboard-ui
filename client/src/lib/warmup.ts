// AI Model Warmup Utilities

/**
 * Warm up the AI model before document uploads to improve performance
 */
export async function warmupModel(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    console.log("🔥 Starting AI model warmup...");
    
    const response = await fetch('/api/warmup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log("✅ AI model warmed up successfully");
      return {
        success: true,
        message: result.message || "AI model is ready for document analysis"
      };
    } else {
      console.warn("⚠️ Model warmup failed:", result.error);
      return {
        success: false,
        message: "Model warmup failed",
        error: result.error || "Unknown warmup error"
      };
    }
    
  } catch (error) {
    console.error("❌ Model warmup error:", error);
    return {
      success: false,
      message: "Failed to warm up AI model",
      error: error instanceof Error ? error.message : "Network error"
    };
  }
}

/**
 * Check if the AI model is ready and warmed up
 */
export async function checkModelStatus(): Promise<{
  ready: boolean;
  ollama_available: boolean;
  available_models: string[];
}> {
  try {
    const response = await fetch('/api/warmup/status');
    
    if (response.ok) {
      const status = await response.json();
      return {
        ready: status.ready || false,
        ollama_available: status.ollama_available || false,
        available_models: status.available_models || []
      };
    }
    
    return {
      ready: false,
      ollama_available: false,
      available_models: []
    };
    
  } catch (error) {
    console.error("Error checking model status:", error);
    return {
      ready: false,
      ollama_available: false,
      available_models: []
    };
  }
}

/**
 * Auto-warmup when the application starts
 */
export async function autoWarmupOnLoad(): Promise<void> {
  try {
    const status = await checkModelStatus();
    
    if (status.ollama_available && !status.ready) {
      console.log("🔥 Auto-warming up AI model on application load...");
      const warmupResult = await warmupModel();
      
      if (warmupResult.success) {
        console.log("✅ Auto-warmup completed successfully");
      } else {
        console.warn("⚠️ Auto-warmup failed, but continuing:", warmupResult.error);
      }
    } else if (!status.ollama_available) {
      console.log("📋 Ollama not available - skipping auto-warmup");
    } else {
      console.log("✅ AI model appears to be ready");
    }
    
  } catch (error) {
    console.warn("Auto-warmup check failed:", error);
  }
}