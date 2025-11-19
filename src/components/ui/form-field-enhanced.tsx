"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { FieldError } from "react-hook-form";

interface FormFieldEnhancedProps {
  label: string | React.ReactNode;
  required?: boolean;
  description?: string;
  error?: FieldError;
  touched?: boolean;
  isValid?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Enhanced form field with visual feedback
 * Shows success indicator when field is valid and touched
 */
export function FormFieldEnhanced({
  label,
  required,
  description,
  error,
  touched,
  isValid,
  children,
  className,
}: FormFieldEnhancedProps) {
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
      <FormMessage />
    </FormItem>
  );
}

