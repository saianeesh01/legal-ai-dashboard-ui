import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressCircle } from "@tremor/react";
import { Upload, File, CheckCircle, AlertCircle, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { uploadFile, pollJobStatus, ApiError } from "@/lib/api";

interface FileUploaderProps {
  onUploadComplete: (results: any) => void;
}

const FileUploader = ({ onUploadComplete }: FileUploaderProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "complete" | "error">("idle");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFiles([file]);
    setIsUploading(true);
    setUploadStatus("uploading");
    setUploadProgress(0);

    try {
      // Upload file using API helper
      const { job_id } = await uploadFile(file);
      setJobId(job_id);
      setUploadStatus("processing");

      // Poll for processing status
      await pollJobStatus(
        job_id,
        (progress) => setUploadProgress(progress)
      );

      setUploadStatus("complete");
      setIsUploading(false);
      
      toast({
        title: "Upload complete!",
        description: "Your document has been processed successfully.",
      });

      // Return results to parent component
      onUploadComplete({
        jobId: job_id,
        fileName: file.name,
        fileSize: file.size,
        processedAt: new Date().toISOString(),
      });

    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setIsUploading(false);
      
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : "There was an error uploading your file.";
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const removeFile = () => {
    setUploadedFiles([]);
    setUploadStatus("idle");
    setUploadProgress(0);
    setJobId(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Document</span>
          </CardTitle>
          <CardDescription>
            Upload a PDF or image file to analyze. Maximum file size: 10MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadedFiles.length === 0 ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-smooth hover:border-primary ${
                isDragActive ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-primary">Drop the file here...</p>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-2">Drop your file here</p>
                  <p className="text-muted-foreground mb-4">
                    or click to browse your computer
                  </p>
                  <Button variant="outline">
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                  <File className="h-8 w-8 text-primary" />
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
                  
                  {(uploadStatus === "uploading" || uploadStatus === "processing") && (
                    <div className="flex items-center space-x-2">
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
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {uploadStatus === "uploading" ? "Uploading..." : "Processing..."}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUploader;