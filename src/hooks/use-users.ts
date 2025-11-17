"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { usersService } from "@/lib/services";
import { queryKeys } from "@/lib/constants/query-keys";

export function useSyncUser() {
  return useMutation({
    mutationFn: () => usersService.syncUserClient(),
    onError: (error) => console.error("Failed to sync user:", error),
  });
}

export function useSelectRole() {
  return useMutation({
    mutationFn: (role: "PATIENT" | "DOCTOR" | "ADMIN") => usersService.selectRole(role),
    onError: (error) => console.error("Failed to select role:", error),
  });
}

