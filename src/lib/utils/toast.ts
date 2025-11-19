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
 * Show error toast
 */
export function showError(message: string, duration = 5000) {
  toast.error(message, { duration });
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
 */
export function handleApiError(error: unknown, defaultMessage?: string): string {
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

