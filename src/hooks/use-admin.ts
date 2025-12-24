"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/lib/services";
import { queryKeys } from "@/lib/constants/query-keys";
import { handleApiError } from "@/lib/utils/toast";
import { showErrorToast } from "@/components/shared/ErrorToast";
import type { VerificationWithDoctor } from "@/lib/types";
import type { DoctorApplication } from "@/lib/types/rbac";

export function useAdminDoctorVerifications(status?: "PENDING" | "APPROVED" | "REJECTED") {
  return useQuery<VerificationWithDoctor[]>({
    queryKey: queryKeys.admin.verifications(status),
    queryFn: async () => {
      return (await adminService.getDoctorVerifications(status)) as VerificationWithDoctor[];
    },
  });
}

export function useAdminDoctorApplications() {
  return useQuery<DoctorApplication[]>({
    queryKey: queryKeys.admin.applications,
    queryFn: async () => {
      const response = await fetch("/api/admin/doctors/applications");
      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }
      const data = await response.json();
      return data.applications || [];
    },
  });
}

export function useUpdateVerificationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ verificationId, data }: { 
      verificationId: string; 
      data: Parameters<typeof adminService.updateVerificationStatus>[1] 
    }) =>
      adminService.updateVerificationStatus(verificationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, "Failed to update verification status");
      showErrorToast({ message: errorMessage });
    },
  });
}

