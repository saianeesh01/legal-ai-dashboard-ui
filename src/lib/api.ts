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
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
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
