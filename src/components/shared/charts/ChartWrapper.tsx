"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ChartWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  height?: number;
}

/**
 * Chart wrapper component
 * Provides consistent styling, loading states, and error handling for charts
 */
export function ChartWrapper({
  title,
  description,
  children,
  isLoading = false,
  error = null,
  className,
  height = 300,
}: ChartWrapperProps) {
  if (isLoading) {
    return <ChartSkeleton className={className} height={height} />;
  }

  if (error) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-destructive">
            <p>Error loading chart: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ minHeight: `${height}px` }}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

