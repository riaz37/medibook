"use client";

import { useQuery } from "@tanstack/react-query";
import type { Role } from "@/lib/types/rbac";

/**
 * Hook to get the current user's role
 * Uses React Query to fetch and cache the current user's role
 */
export function useRole(): Role | null {
  const { data } = useQuery<{ role: Role | null }>({
    queryKey: ["current-user-role"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return { role: null };
      const data = await res.json();
      return { role: data.role };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  return data?.role ?? null;
}
