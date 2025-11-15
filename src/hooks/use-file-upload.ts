"use client";

import { useState } from "react";
import { toast } from "sonner";

interface UploadResult {
  url: string;
  publicId: string;
}

interface UseFileUploadOptions {
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File): Promise<UploadResult | null> => {
    const {
      folder,
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes,
      onSuccess,
      onError,
    } = options;

    // Validate file size
    if (file.size > maxSize) {
      const error = new Error(
        `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`
      );
      toast.error(error.message);
      onError?.(error);
      return null;
    }

    // Validate file type if specified
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      const error = new Error("File type not allowed");
      toast.error(error.message);
      onError?.(error);
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (folder) {
        formData.append("folder", folder);
      }

      // Simulate progress (Cloudinary doesn't provide progress events in this setup)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      const result: UploadResult = await response.json();
      toast.success("File uploaded successfully");
      onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload file";
      toast.error(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const deleteFile = async (publicId: string | null, url?: string): Promise<boolean> => {
    if (!publicId && !url) {
      toast.error("No file identifier provided");
      return false;
    }

    try {
      const params = new URLSearchParams();
      if (publicId) {
        params.append("publicId", publicId);
      }
      if (url) {
        params.append("url", url);
      }

      const response = await fetch(`/api/upload?${params.toString()}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete file");
      }

      toast.success("File deleted successfully");
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete file";
      toast.error(errorMessage);
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    isUploading,
    progress,
  };
}

