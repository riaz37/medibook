"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { queryKeys } from "@/lib/constants/query-keys";

export function usePatientPayments() {
  return useQuery({
    queryKey: queryKeys.payments.patient(),
    queryFn: () => apiClient.getPatientPayments(),
  });
}

export function useDoctorPayments(doctorId: string) {
  return useQuery({
    queryKey: queryKeys.payments.doctor(doctorId),
    queryFn: () => apiClient.getDoctorPayments(doctorId),
    enabled: !!doctorId,
  });
}

export function useDoctorBilling(doctorId: string, month?: number, year?: number) {
  return useQuery({
    queryKey: queryKeys.payments.billing(doctorId, month, year),
    queryFn: () => apiClient.getDoctorBilling(doctorId, month, year),
    enabled: !!doctorId,
  });
}

export function useAppointmentTrends(period: string) {
  return useQuery({
    queryKey: queryKeys.analytics.trends(period),
    queryFn: () => apiClient.getAppointmentTrends(period),
  });
}

export function useAdminRevenue(period?: string) {
  return useQuery({
    queryKey: queryKeys.analytics.revenue(period),
    queryFn: () => apiClient.getAdminRevenue(period),
  });
}

/**
 * Hook to fetch doctor payment account setup status
 */
export function useDoctorPaymentAccountStatus(doctorId: string) {
  return useQuery({
    queryKey: [...queryKeys.payments.doctor(doctorId), "account-status"],
    queryFn: async () => {
      const response = await fetch(`/api/doctors/${doctorId}/payment-setup`);
      if (!response.ok) {
        return { exists: false };
      }
      return response.json();
    },
    enabled: !!doctorId,
  });
}

/**
 * Hook to fetch commission percentage
 */
export function useCommissionPercentage() {
  return useQuery({
    queryKey: ["commission", "percentage"],
    queryFn: async () => {
      const response = await fetch("/api/settings/commission");
      if (!response.ok) {
        return 3.0; // Default fallback
      }
      const data = await response.json();
      return data.commissionPercentage || 3.0;
    },
  });
}

