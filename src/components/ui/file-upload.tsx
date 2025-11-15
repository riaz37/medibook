"use client";

import { useRef, useState } from "react";
import { Button } from "./button";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Upload, X, File } from "lucide-react";
import { Progress } from "./progress";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUploadComplete?: (url: string, publicId: string) => void;
  onUploadError?: (error: Error) => void;
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  accept?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  folder,
  maxSize,
  allowedTypes,
  accept,
  label = "Upload File",
  className,
  disabled = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { uploadFile, isUploading, progress } = useFileUpload({
    folder,
    maxSize,
    allowedTypes,
    onSuccess: (result) => {
      onUploadComplete?.(result.url, result.publicId);
      setSelectedFile(null);
    },
    onError: (error) => {
      onUploadError?.(error);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      await uploadFile(selectedFile);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button
            type="button"
            variant="outline"
            disabled={disabled || isUploading}
            className="cursor-pointer"
            asChild
          >
            <span>
              <Upload className="mr-2 h-4 w-4" />
              {label}
            </span>
          </Button>
        </label>
        {selectedFile && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {selectedFile && (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
          <File className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
          <span className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </span>
        </div>
      )}

      {isUploading && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">Uploading...</p>
        </div>
      )}
    </div>
  );
}

