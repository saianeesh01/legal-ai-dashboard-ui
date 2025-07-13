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
    return result;
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
  while (true) {
    const res = await fetch(`/api/status/${jobId}`);
    if (!res.ok) throw new ApiError(res.status, await res.text());

    const { pct = 0, state } = (await res.json()) as {
      pct?: number;
      state: "PENDING" | "PROCESSING" | "DONE" | "ERROR";
    };

    onProgress(pct);

    if (state === "DONE") return;
    if (state === "ERROR")
      throw new ApiError(500, "Server reported processing error");

    await new Promise((r) => setTimeout(r, interval));
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
