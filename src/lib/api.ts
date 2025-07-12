// API helper functions for connecting to Flask backend

const API_BASE_URL = "";

export interface UploadResponse {
  job_id: string;
}

export interface StatusResponse {
  pct: number;
  state: "PENDING" | "DONE" | "ERROR";
}

export interface QueryResponse {
  answer: string;
  context: Array<{
    page: number;
    text: string;
  }>;
}

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

// Upload file to Flask backend
export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(`Upload failed: ${response.statusText}`, response.status);
  }

  return response.json();
}

// Check processing status
export async function getJobStatus(jobId: string): Promise<StatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/status/${jobId}`);

  if (!response.ok) {
    throw new ApiError(`Status check failed: ${response.statusText}`, response.status);
  }

  return response.json();
}

// Query the processed document
export async function queryDocument(query: string): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new ApiError(`Query failed: ${response.statusText}`, response.status);
  }

  return response.json();
}

// Utility function to poll job status until completion
export async function pollJobStatus(
  jobId: string,
  onProgress?: (progress: number) => void,
  pollInterval = 1000
): Promise<StatusResponse> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await getJobStatus(jobId);
        
        if (onProgress) {
          onProgress(status.pct);
        }

        if (status.state === "DONE") {
          resolve(status);
        } else if (status.state === "ERROR") {
          reject(new ApiError("Processing failed"));
        } else {
          // Continue polling
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
}