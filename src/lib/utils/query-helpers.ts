/**
 * React Query Helper Utilities
 * Provides consistent patterns for handling loading, error, and empty states
 */

import React from "react";
import { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { LoadingSpinner, PageLoading, CardLoading } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { showErrorToast } from "@/components/shared/ErrorToast";
import { handleApiError } from "./toast";

/**
 * Standard loading state component selector
 */
export function getLoadingComponent(type: "page" | "card" | "spinner" = "spinner"): React.ReactElement {
  switch (type) {
    case "page":
      return React.createElement(PageLoading);
    case "card":
      return React.createElement(CardLoading);
    case "spinner":
    default:
      return React.createElement(LoadingSpinner, { size: "md" });
  }
}

/**
 * Handle query error with consistent error toast
 */
export function handleQueryError(
  error: unknown,
  defaultMessage: string,
  retry?: () => void
) {
  const errorMessage = handleApiError(error, defaultMessage);
  showErrorToast({
    message: errorMessage,
    retry,
  });
}

/**
 * Standard empty state for lists
 */
export function getEmptyState(
  title: string,
  description: string,
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  },
  icon?: React.ComponentType<{ className?: string }>
): React.ReactElement {
  return React.createElement(EmptyState, {
    icon,
    title,
    description,
    action,
  });
}

/**
 * Query result wrapper that handles loading, error, and empty states
 */
export function useQueryResult<TData, TError = Error>(
  query: UseQueryResult<TData, TError>,
  options: {
    loadingType?: "page" | "card" | "spinner";
    emptyTitle?: string;
    emptyDescription?: string;
    emptyAction?: {
      label: string;
      href?: string;
      onClick?: () => void;
    };
    emptyIcon?: React.ComponentType<{ className?: string }>;
    onError?: (error: TError) => void;
    isEmpty?: (data: TData) => boolean;
  } = {}
) {
  const {
    loadingType = "spinner",
    emptyTitle,
    emptyDescription,
    emptyAction,
    emptyIcon,
    onError,
    isEmpty = (data) => {
      if (Array.isArray(data)) return data.length === 0;
      if (data === null || data === undefined) return true;
      return false;
    },
  } = options;

  // Handle loading state
  if (query.isLoading || query.isPending) {
    return {
      isLoading: true,
      component: getLoadingComponent(loadingType),
    };
  }

  // Handle error state
  if (query.isError && query.error) {
    if (onError) {
      onError(query.error);
    } else {
      handleQueryError(query.error, "Failed to load data", () => query.refetch());
    }
    return {
      isError: true,
      error: query.error,
    };
  }

  // Handle empty state
  if (query.data && isEmpty(query.data)) {
    if (emptyTitle && emptyDescription) {
      return {
        isEmpty: true,
        component: getEmptyState(emptyTitle, emptyDescription, emptyAction, emptyIcon),
      };
    }
  }

  // Return data
  return {
    data: query.data,
    isLoading: false,
    isError: false,
    isEmpty: false,
  };
}

/**
 * Mutation result wrapper for consistent error handling
 */
export function useMutationResult<TData, TError = Error, TVariables = unknown>(
  mutation: UseMutationResult<TData, TError, TVariables>,
  options: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: TData) => void;
    onError?: (error: TError) => void;
  } = {}
) {
  const { successMessage, errorMessage = "Operation failed", onSuccess, onError } = options;

  // Handle success
  if (mutation.isSuccess && mutation.data) {
    if (successMessage) {
      // Success toast would be shown by the component
    }
    if (onSuccess) {
      onSuccess(mutation.data);
    }
  }

  // Handle error
  if (mutation.isError && mutation.error) {
    if (onError) {
      onError(mutation.error);
    } else {
      handleQueryError(mutation.error, errorMessage);
    }
  }

  return {
    ...mutation,
    handleSuccess: onSuccess,
    handleError: onError,
  };
}

