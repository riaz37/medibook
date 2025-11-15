"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doctorsService } from "@/lib/services";
import type { CreateDoctorInput, UpdateDoctorInput } from "@/lib/types";

export function useGetDoctors() {
  return useQuery({
    queryKey: ["getDoctors"],
    queryFn: () => doctorsService.getAll(),
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDoctorInput) => doctorsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getDoctors"] });
    },
    onError: (error) => console.error("Error while creating a doctor:", error),
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDoctorInput) => doctorsService.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getDoctors"] });
      queryClient.invalidateQueries({ queryKey: ["getAvailableDoctors"] });
    },
    onError: (error) => console.error("Failed to update doctor:", error),
  });
}

export function useAvailableDoctors() {
  return useQuery({
    queryKey: ["getAvailableDoctors"],
    queryFn: () => doctorsService.getAvailable(),
  });
}
