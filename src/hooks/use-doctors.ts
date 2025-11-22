"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doctorsService } from "@/lib/services";
import { queryKeys } from "@/lib/constants/query-keys";
import { handleApiError, toastMessages } from "@/lib/utils/toast";
import { showErrorToast } from "@/components/shared/ErrorToast";
import type { CreateDoctorInput, UpdateDoctorInput } from "@/lib/types";
import type { DoctorAppointmentType } from "@/lib/types/doctor-config";

export function useGetDoctors() {
  return useQuery({
    queryKey: queryKeys.doctors.lists(),
    queryFn: () => doctorsService.getAll(),
  });
}

export function useGetAllDoctorsForAdmin() {
  return useQuery({
    queryKey: queryKeys.doctors.admin(),
    queryFn: () => doctorsService.getAllForAdmin(),
  });
}

export function useGetDoctorById(id: string) {
  return useQuery({
    queryKey: queryKeys.doctors.detail(id),
    queryFn: () => doctorsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDoctorInput) => doctorsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, "Failed to create doctor");
      showErrorToast({ message: errorMessage });
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDoctorInput) => doctorsService.update(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.detail(data.id) });
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, "Failed to update doctor");
      showErrorToast({ message: errorMessage });
    },
  });
}

export function useAvailableDoctors() {
  return useQuery({
    queryKey: queryKeys.doctors.available(),
    queryFn: () => doctorsService.getAvailable(),
  });
}

export function useSubmitDoctorVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ doctorId, data }: { doctorId: string; data: Parameters<typeof doctorsService.submitVerification>[1] }) =>
      doctorsService.submitVerification(doctorId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.verification(variables.doctorId) });
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, toastMessages.error.documentUploadFailed);
      showErrorToast({ message: errorMessage });
    },
  });
}

export function useUpdateDoctorConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ doctorId, data }: { doctorId: string; data: Parameters<typeof doctorsService.updateConfig>[1] }) =>
      doctorsService.updateConfig(doctorId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.config(variables.doctorId) });
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, toastMessages.error.settingsSaveFailed);
      showErrorToast({ message: errorMessage });
    },
  });
}

export function useUpdateDoctorWorkingHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ doctorId, data }: { doctorId: string; data: Parameters<typeof doctorsService.updateWorkingHours>[1] }) =>
      doctorsService.updateWorkingHours(doctorId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.workingHours(variables.doctorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.config(variables.doctorId) });
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, toastMessages.error.settingsSaveFailed);
      showErrorToast({ message: errorMessage });
    },
  });
}

export function useCreateDoctorAppointmentType() {
  const queryClient = useQueryClient();

  return useMutation<DoctorAppointmentType, Error, { doctorId: string; data: Parameters<typeof doctorsService.createAppointmentType>[1] }>({
    mutationFn: ({ doctorId, data }) =>
      doctorsService.createAppointmentType(doctorId, data) as Promise<DoctorAppointmentType>,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.appointmentTypes(variables.doctorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.config(variables.doctorId) });
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, toastMessages.error.settingsSaveFailed);
      showErrorToast({ message: errorMessage });
    },
  });
}

export function useUpdateDoctorAppointmentType() {
  const queryClient = useQueryClient();

  return useMutation<DoctorAppointmentType, Error, { doctorId: string; typeId: string; data: Parameters<typeof doctorsService.updateAppointmentType>[2] }>({
    mutationFn: ({ doctorId, typeId, data }) =>
      doctorsService.updateAppointmentType(doctorId, typeId, data) as Promise<DoctorAppointmentType>,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.appointmentTypes(variables.doctorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.config(variables.doctorId) });
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, toastMessages.error.settingsSaveFailed);
      showErrorToast({ message: errorMessage });
    },
  });
}

export function useDeleteDoctorAppointmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ doctorId, typeId }: { doctorId: string; typeId: string }) =>
      doctorsService.deleteAppointmentType(doctorId, typeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.appointmentTypes(variables.doctorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.config(variables.doctorId) });
    },
    onError: (error) => {
      const errorMessage = handleApiError(error, "Failed to delete appointment type");
      showErrorToast({ message: errorMessage });
    },
  });
}
