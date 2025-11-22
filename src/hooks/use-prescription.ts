"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { prescriptionsService } from "@/lib/services";
import { queryKeys } from "@/lib/constants/query-keys";
import { handleApiError, toastMessages, showSuccess } from "@/lib/utils/toast";
import { showErrorToast } from "@/components/shared/ErrorToast";
import type {
  CreatePrescriptionInput,
  UpdatePrescriptionInput,
  RequestRefillInput,
  ProcessRefillInput,
  MedicationSearchInput,
} from "@/lib/validations/prescription.schema";
import type { PrescriptionWithDetails } from "@/lib/types/prescription";

export function usePrescriptionById(id: string) {
  return useQuery<PrescriptionWithDetails>({
    queryKey: queryKeys.prescriptions.detail(id),
    queryFn: () => prescriptionsService.getById(id),
    enabled: !!id,
  });
}

export function useDoctorPrescriptions(params?: {
  status?: string;
  patientId?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: queryKeys.prescriptions.doctor(params),
    queryFn: () => prescriptionsService.getDoctorPrescriptions(params),
  });
}

export function usePatientPrescriptions(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: queryKeys.prescriptions.patient(params),
    queryFn: () => prescriptionsService.getPatientPrescriptions(params),
  });
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePrescriptionInput) => prescriptionsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.doctor() });
      showSuccess("Prescription created successfully");
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, "Failed to create prescription");
      showErrorToast({ message: errorMessage });
    },
  });
}

export function useUpdatePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePrescriptionInput }) =>
      prescriptionsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.detail(variables.id) });
      showSuccess("Prescription updated successfully");
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, "Failed to update prescription");
      showErrorToast({ message: errorMessage });
    },
  });
}

export function useRequestRefill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      prescriptionId,
      itemId,
      data,
    }: {
      prescriptionId: string;
      itemId: string;
      data: RequestRefillInput;
    }) => prescriptionsService.requestRefill(prescriptionId, itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.detail(variables.prescriptionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.patient() });
      showSuccess("Refill request submitted successfully");
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, "Failed to request refill");
      showErrorToast({ message: errorMessage });
    },
  });
}

export function useProcessRefill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      prescriptionId,
      itemId,
      data,
    }: {
      prescriptionId: string;
      itemId: string;
      data: ProcessRefillInput;
    }) => prescriptionsService.processRefill(prescriptionId, itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.detail(variables.prescriptionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.doctor() });
      showSuccess(`Refill ${variables.data.status.toLowerCase()} successfully`);
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, "Failed to process refill");
      showErrorToast({ message: errorMessage });
    },
  });
}

export function useSearchMedications() {
  return useMutation({
    mutationFn: (input: MedicationSearchInput) => prescriptionsService.searchMedications(input),
    onError: (error) => {
      const errorMessage = handleApiError(error, "Failed to search medications");
      showErrorToast({ message: errorMessage });
    },
  });
}

export function useDownloadPrescriptionPDF() {
  return useMutation({
    mutationFn: (id: string) => prescriptionsService.downloadPDF(id),
    onSuccess: (blob, id) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess("Prescription PDF downloaded successfully");
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, "Failed to download PDF");
      showErrorToast({ message: errorMessage });
    },
  });
}

