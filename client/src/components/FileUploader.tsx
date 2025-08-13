import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { ProgressCircle } from "@tremor/react";
import {
  Upload,
  File as FileIcon,
  CheckCircle,
  AlertCircle,
  X,
  Clock,
  Files,
  Loader2,
  Zap,
  CheckSquare,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { uploadFile, pollJobStatus, checkDuplicate, deleteDocument, ApiError, uploadBatch, getBatchStatus } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { UploadHelp } from "./ContextualHelpTooltip";

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

interface FileUploaderProps {
  onUploadComplete: (results: Array<{
    jobId: string;
    fileName: string;
    fileSize: number;
    processedAt: string;
  }>) => void;
}

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface FileUploadStatus {
  file: File;
  status: "pending" | "uploading" | "processing" | "complete" | "error";
  progress: number;
  jobId?: string;
  error?: string;
  startTime?: number;
  estimatedTime?: number;
  timeRemaining?: number;
}

interface BatchJobStatus {
  id: string;
  filename: string;
  status: string;
  result_path?: string;
  doc_type?: string;
  error_message?: string;
}

interface BatchStatus {
  success: boolean;
  batch_id: string;
  created_at: string;
  completed_count: number;
  error_count: number;
  jobs: BatchJobStatus[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const FileUploader = ({ onUploadComplete }: FileUploaderProps) => {
  const [fileUploads, setFileUploads] = useState<FileUploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
  
  // Batch processing state
  const [useBatchProcessing, setUseBatchProcessing] = useState(false);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [isBatchPolling, setIsBatchPolling] = useState(false);

  const queryClient = useQueryClient();

  /* ----------------------- async upload flow ---------------------- */

  const handleFiles = async (acceptedFiles: File[]) => {
    console.log("handleFiles called with:", acceptedFiles.length, "files");
    if (acceptedFiles.length === 0) return;

    /* ---------- validation ---------- */
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
    ];

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    for (const file of acceptedFiles) {
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(file.name);
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (too large)`);
        continue;
      }

      validFiles.push(file);
    }

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid files",
        description: `The following files were skipped: ${invalidFiles.join(", ")}`,
        variant: "destructive",
      });
    }

    if (validFiles.length === 0) return;

    /* ---------- check for duplicates ---------- */
    const filesToUpload: File[] = [];
    const duplicateFiles: File[] = [];

    for (const file of validFiles) {
      try {
        const duplicateCheck = await checkDuplicate(file.name);
        if (duplicateCheck.isDuplicate) {
          duplicateFiles.push(file);
        } else {
          filesToUpload.push(file);
        }
      } catch (err) {
        console.error("Duplicate check failed for", file.name, err);
        filesToUpload.push(file); // Continue with upload if duplicate check fails
      }
    }

    if (duplicateFiles.length > 0) {
      setPendingFiles(duplicateFiles);
      setDuplicateInfo({ count: duplicateFiles.length, files: duplicateFiles });
      setShowDuplicateDialog(true);
    }

    if (filesToUpload.length > 0) {
      console.log("Starting upload for", filesToUpload.length, "files");
      
      // Auto-detect if batch processing should be used (5+ files)
      const shouldUseBatch = filesToUpload.length >= 3;
      setUseBatchProcessing(shouldUseBatch);
      
      if (shouldUseBatch) {
        await performBatchUpload(filesToUpload);
      } else {
        await performMultipleUploads(filesToUpload);
      }
    }
  };

  const performBatchUpload = async (files: File[]) => {
    console.log("performBatchUpload called with", files.length, "files");
    setIsUploading(true);

    try {
      // Initialize upload status for all files
      const initialUploads: FileUploadStatus[] = files.map(file => ({
        file,
        status: "pending",
        progress: 0,
      }));

      setFileUploads(initialUploads);

      // Upload batch to AI service
      const result = await uploadBatch(files);
      
      // Update status to processing
      setFileUploads(prev => prev.map(upload => ({
        ...upload,
        status: "processing" as const,
        progress: 50
      })));

      // Set batch status and start polling
      setBatchStatus({
        success: true,
        batch_id: result.batch_id,
        created_at: new Date().toISOString(),
        completed_count: 0,
        error_count: 0,
        jobs: result.jobs.map(job => ({
          id: job.id,
          filename: job.filename,
          status: job.status
        }))
      });

      // Start polling for batch status
      startBatchStatusPolling(result.batch_id);

      toast({
        title: "Batch upload started",
        description: `Processing ${files.length} files in parallel...`,
      });

    } catch (err) {
      console.error("Batch upload failed:", err);
      const errorMsg = err instanceof ApiError ? err.message : "Batch upload failed";
      
      setFileUploads(prev => prev.map(upload => ({
        ...upload,
        status: "error" as const,
        error: errorMsg
      })));

      toast({
        title: "Batch upload failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const startBatchStatusPolling = async (batchId: string) => {
    setIsBatchPolling(true);
    
    const pollInterval = setInterval(async () => {
      try {
        const status = await getBatchStatus(batchId);
        setBatchStatus(status);
        
        // Update individual file statuses based on batch status
        setFileUploads(prev => prev.map(upload => {
          const batchJob = status.jobs.find(job => job.filename === upload.file.name);
          if (batchJob) {
            let newStatus: FileUploadStatus['status'] = 'processing';
            let progress = 50;
            
            switch (batchJob.status) {
              case 'queued':
                newStatus = 'pending';
                progress = 25;
                break;
              case 'running':
                newStatus = 'processing';
                progress = 75;
                break;
              case 'done':
                newStatus = 'complete';
                progress = 100;
                break;
              case 'error':
                newStatus = 'error';
                progress = 0;
                break;
            }
            
            return {
              ...upload,
              status: newStatus,
              progress,
              error: batchJob.error_message
            };
          }
          return upload;
        }));
        
        // Check if all jobs are completed
        if (status.completed_count + status.error_count === status.jobs.length) {
          clearInterval(pollInterval);
          setIsBatchPolling(false);
          
          // Invalidate document queries to refresh the UI
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          
          if (status.error_count === 0) {
            toast({
              title: "Batch processing complete!",
              description: `Successfully processed ${status.completed_count} files.`,
            });
          } else {
            toast({
              title: "Batch processing finished",
              description: `${status.completed_count} files processed, ${status.error_count} failed.`,
              variant: status.error_count > status.completed_count ? "destructive" : "default",
            });
          }
          
          // Call onUploadComplete with batch results
          const uploadResults = status.jobs
            .filter(job => job.status === 'done')
            .map(job => ({
              jobId: job.id,
              fileName: job.filename,
              fileSize: 0, // We don't have file size in batch status
              processedAt: new Date().toISOString(),
            }));
          
          if (uploadResults.length > 0) {
            onUploadComplete(uploadResults);
          }
        }
      } catch (error) {
        console.error('Failed to get batch status:', error);
        clearInterval(pollInterval);
        setIsBatchPolling(false);
      }
    }, 2000); // Poll every 2 seconds
  };

  const performMultipleUploads = async (files: File[]) => {
    console.log("performMultipleUploads called with", files.length, "files");
    setIsUploading(true);

    // Initialize upload status for all files
    const initialUploads: FileUploadStatus[] = files.map(file => ({
      file,
      status: "pending",
      progress: 0,
    }));

    setFileUploads(initialUploads);

    const uploadResults: Array<{
      jobId: string;
      fileName: string;
      fileSize: number;
      processedAt: string;
    }> = [];

    // Process files sequentially to avoid overwhelming the server
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Update status to uploading with start time
        const startTime = Date.now();
        setFileUploads(prev => prev.map((upload, idx) =>
          idx === i ? {
            ...upload,
            status: "uploading" as const,
            startTime,
            estimatedTime: 30000, // 30 seconds estimate
            progress: 0
          } : upload
        ));

        // Simulate upload progress for better UX
        const uploadProgressInterval = setInterval(() => {
          setFileUploads(prev => prev.map((upload, idx) =>
            idx === i && upload.status === "uploading" ? {
              ...upload,
              progress: Math.min(upload.progress + 15, 90) // Cap at 90% during upload, faster progress
            } : upload
          ));
        }, 150); // Faster updates for more responsive feel

        // Upload file
        const { job_id } = await uploadFile(file);

        // Clear upload progress interval
        clearInterval(uploadProgressInterval);

        // Update status to processing with 90% progress
        setFileUploads(prev => prev.map((upload, idx) =>
          idx === i ? {
            ...upload,
            status: "processing" as const,
            jobId: job_id,
            progress: 90
          } : upload
        ));

        // Poll for completion with time tracking
        await pollJobStatus(job_id, (pct) => {
          const elapsed = Date.now() - startTime;
          const estimatedTotal = pct > 0 ? (elapsed / pct) * 100 : 30000; // Fallback to 30s if no progress
          const timeRemaining = Math.max(0, estimatedTotal - elapsed);

          console.log(`Job ${job_id} progress: ${pct}%, elapsed: ${elapsed}ms, remaining: ${timeRemaining}ms`);

          setFileUploads(prev => prev.map((upload, idx) =>
            idx === i ? {
              ...upload,
              progress: pct,
              estimatedTime: estimatedTotal,
              timeRemaining
            } : upload
          ));
        });

        // Mark as complete
        setFileUploads(prev => prev.map((upload, idx) =>
          idx === i ? { ...upload, status: "complete" as const, progress: 100 } : upload
        ));

        uploadResults.push({
          jobId: job_id,
          fileName: file.name,
          fileSize: file.size,
          processedAt: new Date().toISOString(),
        });

      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);

        const errorMsg = err instanceof ApiError ? err.message : "Upload failed";

        setFileUploads(prev => prev.map((upload, idx) =>
          idx === i ? {
            ...upload,
            status: "error" as const,
            error: errorMsg
          } : upload
        ));

        toast({
          title: `Upload failed: ${file.name}`,
          description: errorMsg,
          variant: "destructive",
        });
      }
    }

    setIsUploading(false);

    // Invalidate document queries to refresh the UI
    queryClient.invalidateQueries({ queryKey: ["documents"] });

    if (uploadResults.length > 0) {
      toast({
        title: "Upload complete!",
        description: `${uploadResults.length} document${uploadResults.length > 1 ? 's' : ''} processed successfully.`,
      });

      onUploadComplete(uploadResults);
    }
  };

  const handleReplaceFiles = async () => {
    if (!pendingFiles || !duplicateInfo) return;

    try {
      // For now, we'll just upload the files (replace logic would need backend support)
      const shouldUseBatch = pendingFiles.length >= 3;
      setUseBatchProcessing(shouldUseBatch);
      
      if (shouldUseBatch) {
        await performBatchUpload(pendingFiles);
      } else {
        await performMultipleUploads(pendingFiles);
      }
    } catch (err) {
      console.error("Replace failed:", err);
      toast({
        title: "Replace failed",
        description: "Could not replace the existing documents.",
        variant: "destructive",
      });
    } finally {
      setShowDuplicateDialog(false);
      setPendingFiles([]);
      setDuplicateInfo(null);
    }
  };

  const handleKeepAll = async () => {
    if (!pendingFiles) return;

    // Upload the files anyway (keep all)
    const shouldUseBatch = pendingFiles.length >= 3;
    setUseBatchProcessing(shouldUseBatch);
    
    if (shouldUseBatch) {
      await performBatchUpload(pendingFiles);
    } else {
      await performMultipleUploads(pendingFiles);
    }

    setShowDuplicateDialog(false);
    setPendingFiles([]);
    setDuplicateInfo(null);
  };

  /* -------------------- sync wrapper for react-dropzone -------------------- */

  const onDrop = useCallback(
    (accepted: File[]) => {
      void handleFiles(accepted); // ignore the returned promise
    },
    [handleFiles]
  );

  /* ------------------------ react-dropzone hook ------------------------ */

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    multiple: true, // Enable multiple file selection
    disabled: isUploading,
  });

  /* ----------------------------- helpers ----------------------------- */

  const reset = () => {
    setFileUploads([]);
    setBatchStatus(null);
    setIsBatchPolling(false);
  };

  const removeFile = (index: number) => {
    setFileUploads(prev => prev.filter((_, idx) => idx !== index));
  };

  const toggleBatchProcessing = () => {
    setUseBatchProcessing(!useBatchProcessing);
  };

  /* ------------------------------ render ----------------------------- */

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Files className="h-5 w-5 text-blue-300" />
              Upload Documents
            </div>
            <UploadHelp variant="default" side="left" />
          </CardTitle>
          <CardDescription className="text-blue-200">
            Upload multiple PDF or image files (≤ 50 MB each). AI-powered analysis with OCR support.
            {fileUploads.length >= 3 && (
              <span className="ml-2 text-green-300">
                <Zap className="h-3 w-3 inline mr-1" />
                Batch processing available for faster parallel processing
              </span>
            )}
          </CardDescription>
          
          {/* Batch Processing Toggle */}
          {fileUploads.length >= 3 && (
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant={useBatchProcessing ? "default" : "outline"}
                size="sm"
                onClick={toggleBatchProcessing}
                className={`${
                  useBatchProcessing 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : "border-white/30 text-white hover:bg-white/10"
                }`}
              >
                {useBatchProcessing ? (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Batch Processing Enabled
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Enable Batch Processing
                  </>
                )}
              </Button>
              {useBatchProcessing && (
                <span className="text-xs text-green-300 bg-green-900/30 px-2 py-1 rounded">
                  Files will be processed in parallel for faster results
                </span>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {fileUploads.length === 0 ? (
            /* ------------------ Drop area ------------------ */
            (<div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${isUploading
                  ? "border-blue-400 bg-blue-500/20 animate-pulse"
                  : isDragActive
                    ? "border-blue-400 bg-blue-500/10"
                    : "border-white/30 hover:border-blue-400 hover:bg-white/5"
                }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-blue-300" />
              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 mx-auto text-blue-300 animate-spin" />
                  <p className="text-blue-300 font-medium">Processing files...</p>
                  <p className="text-blue-200 text-sm">Please wait while we upload and analyze your documents</p>
                </div>
              ) : isDragActive ? (
                <p className="text-blue-300 font-medium">Drop the files here…</p>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2 text-white">
                    Drop your files here
                  </p>
                  <p className="text-blue-200 mb-4">
                    or click to browse your computer
                  </p>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Choose Files
                  </Button>
                </>
              )}
            </div>)
          ) : (
            /* ----------------- File list + progress ---------------- */
            (<div className="space-y-4">
              {fileUploads.map((upload, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 ${upload.status === "uploading"
                      ? "bg-blue-900/30 border-blue-500/30 animate-pulse"
                      : upload.status === "processing"
                        ? "bg-indigo-900/30 border-indigo-500/30"
                        : upload.status === "complete"
                          ? "bg-green-900/30 border-green-500/30"
                          : upload.status === "error"
                            ? "bg-red-900/30 border-red-500/30"
                            : "bg-white/10 border-white/20"
                    }`}
                >
                  <FileIcon className="h-8 w-8 text-blue-300" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{upload.file.name}</p>
                    <p className="text-sm text-blue-200">
                      {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {upload.status === "uploading" && (
                      <p className="text-xs text-blue-300 mt-1">
                        Uploading to server...
                      </p>
                    )}
                    {upload.status === "processing" && (
                      <p className="text-xs text-blue-300 mt-1">
                        {useBatchProcessing ? "AI analysis in parallel..." : "AI analysis in progress..."}
                      </p>
                    )}
                    {upload.status === "complete" && (
                      <p className="text-xs text-green-300 mt-1">
                        ✓ Analysis complete
                      </p>
                    )}
                    {upload.error && (
                      <p className="text-sm text-red-400 mt-1">{upload.error}</p>
                    )}
                  </div>

                  {upload.status === "complete" && (
                    <div className="flex flex-col items-center">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                      <span className="text-xs text-green-300 mt-1">Complete</span>
                    </div>
                  )}
                  {upload.status === "error" && (
                    <div className="flex flex-col items-center">
                      <AlertCircle className="h-6 w-6 text-red-400" />
                      <span className="text-xs text-red-300 mt-1">Failed</span>
                    </div>
                  )}
                  {(upload.status === "uploading" ||
                    upload.status === "processing") && (
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          {upload.status === "uploading" ? (
                            <div className="relative">
                              <ProgressCircle
                                value={upload.progress}
                                size="lg"
                                color="blue"
                                strokeWidth={10}
                                className="animate-pulse"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-200">
                                  {Math.round(upload.progress)}%
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <ProgressCircle
                                value={upload.progress}
                                size="lg"
                                color="indigo"
                                strokeWidth={10}
                              />
                              <Loader2 className="h-6 w-6 text-indigo-300 animate-spin absolute inset-0 m-auto" />
                            </div>
                          )}
                          <span className="text-xs text-blue-200 mt-2 font-medium">
                            {upload.status === "uploading" ? "UPLOADING" : "PROCESSING"}
                          </span>
                        </div>
                        <div className="flex flex-col text-xs text-blue-200 min-w-0">
                          <span className="font-bold text-sm">
                            {upload.status === "uploading" ? "Uploading to server..." : "AI analysis in progress..."}
                          </span>
                          {upload.timeRemaining && upload.timeRemaining > 0 && (
                            <span className="text-blue-300 font-medium">
                              ~{Math.ceil(upload.timeRemaining / 1000)}s remaining
                            </span>
                          )}
                          {upload.status === "processing" && (
                            <span className="text-blue-300 font-medium">
                              {useBatchProcessing ? "Processing in parallel..." : "Analyzing document content..."}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Remove file"
                      onClick={() => removeFile(idx)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {/* Overall Progress */}
              {isUploading && (
                <div className="space-y-4 p-6 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-lg border border-blue-500/30">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 text-blue-300 animate-spin" />
                      <span className="font-bold text-blue-200 text-lg">
                        {useBatchProcessing ? "Batch Processing Documents" : "Processing Documents"}
                      </span>
                      {useBatchProcessing && (
                        <span className="text-xs text-green-300 bg-green-900/30 px-2 py-1 rounded">
                          Parallel Processing
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-200 text-lg">
                        {fileUploads.filter(u => u.status === "complete").length} of {fileUploads.length}
                      </span>
                      <div className="text-xs text-blue-300">complete</div>
                    </div>
                  </div>
                  <Progress
                    value={(fileUploads.filter(u => u.status === "complete").length / fileUploads.length) * 100}
                    className="h-4 bg-blue-800/50"
                  />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-800/30 rounded p-2">
                      <div className="text-lg font-bold text-blue-200">
                        {fileUploads.filter(u => u.status === "uploading").length}
                      </div>
                      <div className="text-xs text-blue-300">Uploading</div>
                    </div>
                    <div className="bg-indigo-800/30 rounded p-2">
                      <div className="text-lg font-bold text-indigo-200">
                        {fileUploads.filter(u => u.status === "processing").length}
                      </div>
                      <div className="text-xs text-indigo-300">Processing</div>
                    </div>
                    <div className="bg-red-800/30 rounded p-2">
                      <div className="text-lg font-bold text-red-200">
                        {fileUploads.filter(u => u.status === "error").length}
                      </div>
                      <div className="text-xs text-red-300">Failed</div>
                    </div>
                  </div>
                  
                  {/* Batch Processing Status */}
                  {useBatchProcessing && batchStatus && (
                    <div className="mt-4 p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                      <div className="flex items-center gap-2 text-green-300 mb-2">
                        <Zap className="h-4 w-4" />
                        <span className="font-medium">Batch Processing Status</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <div className="text-lg font-bold text-green-200">
                            {batchStatus.jobs.filter(j => j.status === 'queued').length}
                          </div>
                          <div className="text-xs text-green-300">Queued</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-200">
                            {batchStatus.jobs.filter(j => j.status === 'running').length}
                          </div>
                          <div className="text-xs text-blue-300">Running</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-200">
                            {batchStatus.completed_count}
                          </div>
                          <div className="text-xs text-green-300">Completed</div>
                        </div>
                      </div>
                      {isBatchPolling && (
                        <div className="text-center text-xs text-green-300 mt-2">
                          <Clock className="h-3 w-3 inline mr-1 animate-spin" />
                          Monitoring progress...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Reset Button */}
              {!isUploading && fileUploads.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={reset}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>)
          )}
        </CardContent>
      </Card>

      {/* Duplicate Files Dialog */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent className="bg-slate-800 border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Duplicate Files Found</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-blue-200">
                {duplicateInfo?.count} file{duplicateInfo?.count > 1 ? 's' : ''} with the same name{duplicateInfo?.count > 1 ? 's' : ''} already exist{duplicateInfo?.count > 1 ? '' : 's'} in your library.
                {duplicateInfo?.files && (
                  <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="space-y-2">
                      {duplicateInfo.files.map((file: File, idx: number) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm">
                          <FileIcon className="h-4 w-4 text-blue-300" />
                          <span className="font-medium text-white">{file.name}</span>
                          <span className="text-xs text-blue-200">
                            ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3">
                  <strong>What would you like to do?</strong>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:space-x-2">
            <AlertDialogCancel
              onClick={() => {
                setShowDuplicateDialog(false);
                setPendingFiles([]);
                setDuplicateInfo(null);
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleKeepAll}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Keep All
            </Button>
            <AlertDialogAction
              onClick={handleReplaceFiles}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              Replace Existing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FileUploader;
