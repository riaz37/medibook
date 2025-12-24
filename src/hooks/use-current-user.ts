"use client";

import { useQuery } from "@tanstack/react-query";
import type { Role } from "@/lib/types/rbac";

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: Role;
  isLoaded: boolean;
}

/**
 * Hook to get the current authenticated user
 * Replacement for Clerk's useUser hook
 */
export function useCurrentUser() {
  const { data, isLoading, isSuccess } = useQuery<CurrentUser | null>({
    queryKey: ["current-user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  return {
    user: data ? {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      emailAddresses: data.email ? [{ emailAddress: data.email }] : [],
      ...data,
    } : null,
    isLoaded: isSuccess || (!isLoading && !data),
    isSignedIn: !!data,
  };
}
