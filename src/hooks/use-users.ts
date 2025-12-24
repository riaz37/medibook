"use client";

import { useMutation } from "@tanstack/react-query";
import { usersService } from "@/lib/services";

export function useSelectRole() {
  return useMutation({
    mutationFn: (role: "PATIENT" | "DOCTOR" | "ADMIN") => usersService.selectRole(role),
    onError: (error) => console.error("Failed to select role:", error),
  });
}

export function useCurrentUser() {
  return useMutation({
    mutationFn: () => usersService.getCurrentUser(),
    onError: (error) => console.error("Failed to get current user:", error),
  });
}

