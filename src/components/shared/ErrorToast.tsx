"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, X } from "lucide-react";
import type { ErrorToastOptions } from "@/lib/types";

/**
 * Enhanced error toast with retry action
 */
export function showErrorToast({ message, retry, dismiss, duration = 5000 }: ErrorToastOptions) {
  toast.error(message, {
    duration,
    action: retry
      ? {
          label: "Retry",
          onClick: retry,
        }
      : undefined,
    cancel: dismiss
      ? {
          label: "Dismiss",
          onClick: dismiss,
        }
      : undefined,
  });
}

/**
 * Network error toast with retry
 */
export function showNetworkErrorToast(retry?: () => void) {
  showErrorToast({
    message: "Network error. Please check your connection and try again.",
    retry,
  });
}

/**
 * API error toast with context-specific retry
 */
export function showApiErrorToast(message: string, retry?: () => void) {
  showErrorToast({
    message,
    retry,
  });
}

