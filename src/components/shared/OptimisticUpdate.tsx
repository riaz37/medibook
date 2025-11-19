"use client";

import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface OptimisticUpdateProps {
  isLoading: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  showSpinner?: boolean;
}

/**
 * Optimistic Update Wrapper
 * Shows loading state while maintaining the UI structure
 */
export function OptimisticUpdate({
  isLoading,
  children,
  fallback,
  showSpinner = true,
}: OptimisticUpdateProps) {
  if (isLoading && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative">
      {children}
      {isLoading && showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg z-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}

