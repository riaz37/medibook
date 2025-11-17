"use client";

import { useQuery } from "@tanstack/react-query";
import { doctorsService } from "@/lib/services";
import { queryKeys } from "@/lib/constants/query-keys";
import type { DoctorVerification } from "@/lib/types/verification";
import type {
  DoctorConfig,
  DoctorAppointmentType,
  DoctorWorkingHour,
} from "@/lib/types/doctor-config";

/**
 * Hook to fetch doctor's appointment types
 */
export function useDoctorAppointmentTypes(doctorId: string | null) {
  return useQuery<DoctorAppointmentType[]>({
    queryKey: queryKeys.doctors.appointmentTypes(doctorId || ""),
    queryFn: async () => {
      if (!doctorId) return [];
      return (await doctorsService.getAppointmentTypes(doctorId)) as DoctorAppointmentType[];
    },
    enabled: !!doctorId,
  });
}

/**
 * Hook to fetch doctor's available time slots for a specific date
 */
export function useDoctorAvailableSlots(doctorId: string | null, date: string | null) {
  return useQuery<string[]>({
    queryKey: queryKeys.doctors.availableSlots(doctorId || "", date || ""),
    queryFn: async () => {
      if (!doctorId || !date) return [];
      return (await doctorsService.getAvailableSlots(doctorId, date)) as string[];
    },
    enabled: !!doctorId && !!date,
  });
}

/**
 * Hook to fetch doctor's configuration (availability, booking advance days)
 */
export function useDoctorConfig(doctorId: string | null) {
  return useQuery<DoctorConfig | null>({
    queryKey: queryKeys.doctors.config(doctorId || ""),
    queryFn: async () => {
      if (!doctorId) return null;
      return (await doctorsService.getConfig(doctorId)) as DoctorConfig | null;
    },
    enabled: !!doctorId,
  });
}

/**
 * Hook to fetch doctor's working hours
 */
export function useDoctorWorkingHours(doctorId: string | null) {
  return useQuery<DoctorWorkingHour[] | null>({
    queryKey: queryKeys.doctors.workingHours(doctorId || ""),
    queryFn: async () => {
      if (!doctorId) return null;
      return (await doctorsService.getWorkingHours(doctorId)) as DoctorWorkingHour[] | null;
    },
    enabled: !!doctorId,
  });
}

/**
 * Hook to fetch doctor's verification documents
 */
export function useDoctorVerification(doctorId: string | null) {
  return useQuery<DoctorVerification | null>({
    queryKey: queryKeys.doctors.verification(doctorId || ""),
    queryFn: async () => {
      if (!doctorId) return null;
      try {
        return (await doctorsService.getVerification(doctorId)) as DoctorVerification | null;
      } catch (error) {
        // Return null if verification doesn't exist (404)
        if (error instanceof Error && error.message.includes("404")) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!doctorId,
  });
}

