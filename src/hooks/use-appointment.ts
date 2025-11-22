"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentsService } from "@/lib/services";
import { queryKeys } from "@/lib/constants/query-keys";
import { handleApiError, toastMessages } from "@/lib/utils/toast";
import { showErrorToast } from "@/components/shared/ErrorToast";
import type { 
  BookAppointmentInput, 
  UpdateAppointmentStatusInput,
  RescheduleAppointmentInput,
  CancelAppointmentInput,
  AppointmentWithRelations,
} from "@/lib/types";

export function useGetAppointments() {
  return useQuery({
    queryKey: queryKeys.appointments.all,
    queryFn: () => appointmentsService.getAll(),
  });
}

export function useBookedTimeSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: queryKeys.appointments.bookedSlots(doctorId, date),
    queryFn: () => appointmentsService.getBookedTimeSlots(doctorId, date),
    enabled: !!doctorId && !!date,
  });
}

export function useBookAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BookAppointmentInput) => appointmentsService.book(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.user() });
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, toastMessages.error.appointmentBookFailed);
      showErrorToast({ message: errorMessage });
    },
  });
}

export function useUserAppointments(userId?: string) {
  return useQuery({
    queryKey: queryKeys.appointments.user(userId),
    queryFn: () => appointmentsService.getUserAppointments(userId),
  });
}

export function useAppointmentById(id: string) {
  return useQuery<AppointmentWithRelations>({
    queryKey: queryKeys.appointments.detail(id),
    queryFn: () => appointmentsService.getById(id) as Promise<AppointmentWithRelations>,
    enabled: !!id,
  });
}

export function useDoctorAppointments(doctorId?: string) {
  return useQuery({
    queryKey: queryKeys.appointments.doctor(doctorId),
    queryFn: () => appointmentsService.getDoctorAppointments(doctorId),
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAppointmentStatusInput) =>
      appointmentsService.updateStatus(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, toastMessages.error.appointmentUpdateFailed);
      showErrorToast({ message: errorMessage });
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RescheduleAppointmentInput) =>
      appointmentsService.reschedule(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.detail(variables.id) });
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, toastMessages.error.appointmentUpdateFailed);
      showErrorToast({ message: errorMessage });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CancelAppointmentInput) =>
      appointmentsService.cancel(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.detail(variables.id) });
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, toastMessages.error.appointmentCancelFailed);
      showErrorToast({ message: errorMessage });
    },
  });
}

export function useExportAppointmentToICS() {
  return useMutation({
    mutationFn: (id: string) => appointmentsService.exportToICS(id),
    onError: (error) => {
      const errorMessage = handleApiError(error, "Failed to export appointment");
      showErrorToast({ message: errorMessage });
    },
  });
}
