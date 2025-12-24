"use client";

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  touched?: boolean;
  isValid?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Enhanced form field wrapper with visual feedback
 * Shows success indicator when field is valid and touched
 * Extends the base FormFieldEnhanced component
 */
export function FormField({
  label,
  required = false,
  description,
  error,
  touched = false,
  isValid = false,
  children,
  className,
}: FormFieldProps) {
  const showSuccess = touched && isValid && !error;

  return (
    <FormItem className={cn(className)}>
      <FormLabel className="flex items-center gap-2">
        {label}
        {required && <span className="text-destructive">*</span>}
        {showSuccess && (
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
        )}
        {error && touched && (
          <AlertCircle className="h-4 w-4 text-destructive" />
        )}
      </FormLabel>
      <FormControl>{children}</FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      {error && <FormMessage>{error}</FormMessage>}
    </FormItem>
  );
}

