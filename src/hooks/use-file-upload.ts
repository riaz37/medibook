"use client";

import { useState } from "react";
import { toast } from "sonner";
import { uploadService } from "@/lib/services";

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
      // Simulate progress (Cloudinary doesn't provide progress events in this setup)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const result = await uploadService.uploadFile(file, folder);

      clearInterval(progressInterval);
      setProgress(100);

      const uploadResult: UploadResult = {
        url: result.url,
        publicId: result.publicId,
      };
      
      toast.success("File uploaded successfully");
      onSuccess?.(uploadResult);
      return uploadResult;
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
      await uploadService.deleteFile(publicId || undefined, url);
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

