/**
 * Toast Utility
 * Provides consistent toast notification messages across the application
 */

import { toast } from "sonner";

export const toastMessages = {
  success: {
    profileUpdated: "Profile updated successfully",
    appointmentBooked: "Appointment booked successfully",
    appointmentCancelled: "Appointment cancelled successfully",
    appointmentUpdated: "Appointment updated successfully",
    settingsSaved: "Settings saved successfully",
    documentUploaded: "Document uploaded successfully",
    documentDeleted: "Document deleted successfully",
  },
  error: {
    profileUpdateFailed: "Failed to update profile",
    appointmentBookFailed: "Failed to book appointment",
    appointmentCancelFailed: "Failed to cancel appointment",
    appointmentUpdateFailed: "Failed to update appointment",
    settingsSaveFailed: "Failed to save settings",
    documentUploadFailed: "Failed to upload document",
    documentDeleteFailed: "Failed to delete document",
    networkError: "Network error. Please check your connection and try again.",
    unauthorized: "You are not authorized to perform this action",
    notFound: "The requested resource was not found",
    validationError: "Please check your input and try again",
    generic: "An error occurred. Please try again.",
  },
  info: {
    loading: "Processing...",
    saving: "Saving...",
    deleting: "Deleting...",
  },
};

/**
 * Show success toast
 */
export function showSuccess(message: string, duration = 3000) {
  toast.success(message, { duration });
}

/**
 * Show error toast with optional retry action
 */
export function showError(message: string, duration = 5000, retry?: () => void) {
  toast.error(message, {
    duration,
    action: retry
      ? {
          label: "Retry",
          onClick: retry,
        }
      : undefined,
  });
}

/**
 * Show info toast
 */
export function showInfo(message: string, duration = 3000) {
  toast.info(message, { duration });
}

/**
 * Show loading toast (returns a function to dismiss)
 */
export function showLoading(message: string = toastMessages.info.loading) {
  return toast.loading(message);
}

/**
 * Handle API errors with consistent messaging
 * Supports both old format (Error.message) and new format (ApiException with details)
 */
export function handleApiError(error: unknown, defaultMessage?: string): string {
  // Handle ApiException from BaseService
  if (error && typeof error === "object" && "message" in error && "originalError" in error) {
    const apiException = error as { message: string; originalError?: unknown; status?: number };
    
    // Check status codes
    if (apiException.status === 401) {
      return toastMessages.error.unauthorized;
    }
    if (apiException.status === 404) {
      return toastMessages.error.notFound;
    }
    if (apiException.status === 400) {
      // Validation error - message already includes details from BaseService
      return apiException.message || toastMessages.error.validationError;
    }
    
    // Check for common error patterns in message
    if (apiException.message.includes("network") || apiException.message.includes("fetch")) {
      return toastMessages.error.networkError;
    }
    if (apiException.message.includes("validation") || apiException.message.includes("invalid")) {
      return apiException.message || toastMessages.error.validationError;
    }
    
    return apiException.message || defaultMessage || toastMessages.error.generic;
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return toastMessages.error.networkError;
    }
    if (error.message.includes("401") || error.message.includes("unauthorized")) {
      return toastMessages.error.unauthorized;
    }
    if (error.message.includes("404") || error.message.includes("not found")) {
      return toastMessages.error.notFound;
    }
    if (error.message.includes("validation") || error.message.includes("invalid")) {
      return toastMessages.error.validationError;
    }
    return error.message || defaultMessage || toastMessages.error.generic;
  }
  
  return defaultMessage || toastMessages.error.generic;
}

