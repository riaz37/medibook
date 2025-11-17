"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/lib/services";
import { queryKeys } from "@/lib/constants/query-keys";

export interface Verification {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: Date | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  licenseUrl: string | null;
  certificateUrl: string | null;
  idDocumentUrl: string | null;
  doctor: {
    id: string;
    name: string;
    email: string;
    speciality: string;
    imageUrl: string;
    createdAt: Date;
  };
}

export function useAdminDoctorVerifications(status?: "PENDING" | "APPROVED" | "REJECTED") {
  return useQuery<Verification[]>({
    queryKey: queryKeys.admin.verifications(status),
    queryFn: async () => {
      return (await adminService.getDoctorVerifications(status)) as Verification[];
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
    onError: (error) => console.error("Failed to update verification status:", error),
  });
}

