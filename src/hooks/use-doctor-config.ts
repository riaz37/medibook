"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch doctor's appointment types
 */
export function useDoctorAppointmentTypes(doctorId: string | null) {
  return useQuery({
    queryKey: ["doctorAppointmentTypes", doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const response = await fetch(`/api/doctors/${doctorId}/appointment-types`);
      if (!response.ok) throw new Error("Failed to fetch appointment types");
      return response.json();
    },
    enabled: !!doctorId,
  });
}

/**
 * Hook to fetch doctor's available time slots for a specific date
 */
export function useDoctorAvailableSlots(doctorId: string | null, date: string | null) {
  return useQuery({
    queryKey: ["doctorAvailableSlots", doctorId, date],
    queryFn: async () => {
      if (!doctorId || !date) return [];
      const response = await fetch(`/api/doctors/${doctorId}/available-slots?date=${date}`);
      if (!response.ok) throw new Error("Failed to fetch available slots");
      return response.json();
    },
    enabled: !!doctorId && !!date,
  });
}

/**
 * Hook to fetch doctor's configuration (availability, booking advance days)
 */
export function useDoctorConfig(doctorId: string | null) {
  return useQuery({
    queryKey: ["doctorConfig", doctorId],
    queryFn: async () => {
      if (!doctorId) return null;
      const response = await fetch(`/api/doctors/${doctorId}/config`);
      if (!response.ok) throw new Error("Failed to fetch doctor config");
      return response.json();
    },
    enabled: !!doctorId,
  });
}

