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
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { uploadFile, pollJobStatus, checkDuplicate, deleteDocument, ApiError } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { UploadHelp } from "./ContextualHelpTooltip";

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

interface FileUploaderProps {
  onUploadComplete: (results: {
    jobId: string;
    fileName: string;
    fileSize: number;
    processedAt: string;
  }) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const FileUploader = ({ onUploadComplete }: FileUploaderProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "complete" | "error"
  >("idle");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
  
  const queryClient = useQueryClient();

  /* ----------------------- async upload flow ---------------------- */

  const handleFiles = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    /* ---------- validation ---------- */
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 50 MB.",
        variant: "destructive",
      });
      return;
    }

    /* ---------- check for duplicates ---------- */
    try {
      const duplicateCheck = await checkDuplicate(file.name);
      if (duplicateCheck.isDuplicate) {
        setPendingFile(file);
        setDuplicateInfo(duplicateCheck.existingDocument);
        setShowDuplicateDialog(true);
        return;
      }
    } catch (err) {
      console.error("Duplicate check failed:", err);
      // Continue with upload if duplicate check fails
    }

    await performUpload(file);
  };

  const performUpload = async (file: File) => {
    /* ---------- start upload ---------- */
    setUploadedFiles([file]);
    setIsUploading(true);
    setUploadStatus("uploading");
    setUploadProgress(0);

    try {
      const { job_id } = await uploadFile(file);
      setUploadStatus("processing");

      await pollJobStatus(job_id, (pct) => setUploadProgress(pct));

      setUploadStatus("complete");
      setIsUploading(false);

      toast({
        title: "Upload complete!",
        description: "Your document has been processed successfully.",
      });

      // Invalidate document queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      
      onUploadComplete({
        jobId: job_id,
        fileName: file.name,
        fileSize: file.size,
        processedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
      setUploadStatus("error");
      setIsUploading(false);

      const msg =
        err instanceof ApiError
          ? err.message
          : "There was an error uploading your file.";

      toast({
        title: "Upload failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const handleReplaceFile = async () => {
    if (!pendingFile || !duplicateInfo) return;
    
    try {
      // Delete the existing document
      await deleteDocument(duplicateInfo.id);
      
      // Invalidate the documents cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      
      toast({
        title: "Document replaced",
        description: "The existing document has been replaced.",
      });
      
      // Upload the new file
      await performUpload(pendingFile);
    } catch (err) {
      console.error("Replace failed:", err);
      toast({
        title: "Replace failed",
        description: "Could not replace the existing document.",
        variant: "destructive",
      });
    } finally {
      setShowDuplicateDialog(false);
      setPendingFile(null);
      setDuplicateInfo(null);
    }
  };

  const handleKeepBoth = async () => {
    if (!pendingFile) return;
    
    // Upload the new file anyway (keep both)
    await performUpload(pendingFile);
    
    setShowDuplicateDialog(false);
    setPendingFile(null);
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
    maxFiles: 1,
    disabled: isUploading,
  });

  /* ----------------------------- helpers ----------------------------- */

  const reset = () => {
    setUploadedFiles([]);
    setUploadStatus("idle");
    setUploadProgress(0);
  };

  /* ------------------------------ render ----------------------------- */

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </div>
            <UploadHelp variant="default" side="left" />
          </CardTitle>
          <CardDescription>PDF or image ≤ 50 MB. AI-powered analysis with OCR support.</CardDescription>
        </CardHeader>

        <CardContent>
          {uploadedFiles.length === 0 ? (
            /* ------------------ Drop area ------------------ */
            (<div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition hover:border-primary ${
                isDragActive ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-primary">Drop the file here…</p>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">
                    Drop your file here
                  </p>
                  <p className="text-muted-foreground mb-4">
                    or click to browse your computer
                  </p>
                  <Button variant="outline">Choose File</Button>
                </>
              )}
            </div>)
          ) : (
            /* ----------------- File list + progress ---------------- */
            (<div className="space-y-4">
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                >
                  <FileIcon className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  {uploadStatus === "complete" && (
                    <CheckCircle className="h-6 w-6 text-success" />
                  )}
                  {uploadStatus === "error" && (
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  )}
                  {(uploadStatus === "uploading" ||
                    uploadStatus === "processing") && (
                    <div className="flex items-center gap-2">
                      <ProgressCircle value={uploadProgress} size="md" />
                      <span className="text-sm text-muted-foreground">
                        {uploadProgress}%
                      </span>
                    </div>
                  )}

                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Remove file"
                      onClick={reset}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {(uploadStatus === "uploading" ||
                uploadStatus === "processing") && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {uploadStatus === "uploading"
                        ? "Uploading…"
                        : "Processing…"}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>)
          )}
        </CardContent>
      </Card>
      {/* Duplicate File Dialog */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate File Found</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                A file with the name "{pendingFile?.name}" already exists in your library.
                {duplicateInfo && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2 text-sm">
                      <FileIcon className="h-4 w-4" />
                      <span className="font-medium">{duplicateInfo.fileName}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                      <span>{(duplicateInfo.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        {new Date(duplicateInfo.createdAt).toLocaleDateString()}
                      </span>
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
            <AlertDialogCancel onClick={() => {
              setShowDuplicateDialog(false);
              setPendingFile(null);
              setDuplicateInfo(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <Button variant="outline" onClick={handleKeepBoth}>
              Keep Both
            </Button>
            <AlertDialogAction onClick={handleReplaceFile}>
              Replace Existing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FileUploader;
