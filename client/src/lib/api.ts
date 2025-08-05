// A thin, typed wrapper around the two back-end endpoints.

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Add timeout utility function
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 120000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === 'AbortError') {
      throw new ApiError(408, 'Request timeout - document processing is taking longer than expected. Please try with a smaller document.');
    }
    throw error;
  }
}

/** POST a file to /api/upload and return { job_id }. */
export async function uploadFile(file: File): Promise<{ job_id: string }> {
  console.log("uploadFile called with file:", file); // Log when function is called
  const fd = new FormData();
  fd.append("file", file);

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Upload failed:", errorText); // Log error for debugging
      throw new ApiError(res.status, `Upload failed: ${errorText}`);
    }
    const result = await res.json();
    console.log("Upload result:", result); // Log the result for debugging
    
    // Normalize the response - backend returns both jobId and job_id
    const jobId = result.job_id || result.jobId;
    
    if (!jobId) {
      console.error("No job ID in upload response:", result);
      throw new ApiError(500, "Upload succeeded but no job ID returned");
    }
    
    console.log(`Upload successful, job ID: ${jobId}`);
    return { job_id: jobId };
  } catch (err) {
    console.error("Unexpected error in uploadFile:", err);
    throw err;
  }
}

/**
 * Poll /api/status/<job_id> until the server reports DONE.
 * Calls onProgress with the latest percentage each time.
 */
export async function pollJobStatus(
  jobId: string,
  onProgress: (pct: number) => void,
  interval = 1500
): Promise<void> {
  console.log(`Starting status polling for job: ${jobId}`);
  
  while (true) {
    try {
      const res = await fetch(`/api/status/${jobId}`);
      if (!res.ok) throw new ApiError(res.status, await res.text());

      const data = await res.json();
      console.log(`Status poll result:`, data);
      
      const { pct = 0, state } = data as {
        pct?: number;
        state: "PENDING" | "PROCESSING" | "DONE" | "ERROR";
      };

      onProgress(pct);

      if (state === "DONE") {
        console.log(`Job ${jobId} completed successfully`);
        return;
      }
      if (state === "ERROR") {
        throw new ApiError(500, "Server reported processing error");
      }

      await new Promise((r) => setTimeout(r, interval));
    } catch (error) {
      console.error(`Status polling error for ${jobId}:`, error);
      throw error;
    }
  }
}
export async function analyzeDocument(jobId: string): Promise<{
  verdict: "proposal" | "non-proposal";
  confidence: number;
  summary: string;
  suggestions: string[];
}> {
  // Use 2-minute timeout for document analysis
  const res = await fetchWithTimeout("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId }),
  }, 120000); // 2 minutes

  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

export async function queryDocument(
  jobId: string,
  question: string
): Promise<{
  answer: string;
  context: { page: number; text: string }[];
  confidence?: number;
}> {
  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId, question }),
  });

  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

export async function getAllDocuments(): Promise<Array<{
  id: string;
  fileName: string;
  fileSize: number;
  status: string;
  progress: number;
  createdAt: string;
  processedAt?: string;
  aiAnalysis?: {
    verdict: "proposal" | "non-proposal";
    confidence: number;
    summary: string;
    suggestions: string[];
  };
}>> {
  const res = await fetch("/api/documents");
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

export async function deleteDocument(jobId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/documents/${jobId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

export async function checkDuplicate(fileName: string): Promise<{
  isDuplicate: boolean;
  existingDocument?: {
    id: string;
    fileName: string;
    fileSize: number;
    createdAt: string;
  };
}> {
  const res = await fetch("/api/check-duplicate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName }),
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}
