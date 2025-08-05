// A thin, typed wrapper around the two back-end endpoints.

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
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
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId }),
  });

  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

export async function queryDocument(jobId: string, question: string): Promise<{
  answer: string;
  confidence: number;
  sourceExcerpts: string[];
  reasoning: string;
  cannotAnswer: boolean;
  suggestions: string[];
}> {
  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId, query: question }),
  });

  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

// 🚀 Semantic query using FAISS for reduced LLM load
export async function semanticQuery(question: string, model: string = 'mistral:7b-instruct-q4_0'): Promise<{
  success: boolean;
  query: string;
  answer: string;
  model_used: string;
  chunks_used: number;
  total_chunks_searched: number;
  semantic_search_results: any[];
}> {
  const res = await fetch("/api/query/semantic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: question, model }),
  });

  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

// Get vector index statistics
export async function getVectorStats(): Promise<{
  success: boolean;
  stats: any;
}> {
  const res = await fetch("/api/vector/stats", {
    method: "GET",
  });

  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

// Clear vector index
export async function clearVectorIndex(): Promise<{
  success: boolean;
  message: string;
}> {
  const res = await fetch("/api/vector/clear", {
    method: "POST",
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
