"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentsService } from "@/lib/services";
import type { BookAppointmentInput, UpdateAppointmentStatusInput } from "@/lib/types";

export function useGetAppointments() {
  return useQuery({
    queryKey: ["getAppointments"],
    queryFn: () => appointmentsService.getAll(),
  });
}

export function useBookedTimeSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: ["getBookedTimeSlots", doctorId, date],
    queryFn: () => appointmentsService.getBookedTimeSlots(doctorId, date),
    enabled: !!doctorId && !!date,
  });
}

export function useBookAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BookAppointmentInput) => appointmentsService.book(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getUserAppointments"] });
    },
    onError: (error) => console.error("Failed to book appointment:", error),
  });
}

export function useUserAppointments() {
  return useQuery({
    queryKey: ["getUserAppointments"],
    queryFn: () => appointmentsService.getUserAppointments(),
  });
}

export function useAppointmentById(id: string) {
  return useQuery({
    queryKey: ["getAppointmentById", id],
    queryFn: () => appointmentsService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAppointmentStatusInput) =>
      appointmentsService.updateStatus(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getAppointments"] });
      queryClient.invalidateQueries({ queryKey: ["getUserAppointments"] });
    },
    onError: (error) => console.error("Failed to update appointment:", error),
  });
}
