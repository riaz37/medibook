import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface MedicalRecord {
  id: string;
  patientId: string;
  recordType: string;
  title: string;
  description?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  notes?: string | null;
  appointmentId?: string | null;
  attachments?: string | null;
  recordDate: string;
  createdBy: string;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HealthProfile {
  id?: string;
  patientId: string;
  bloodType?: string | null;
  height?: number | null;
  weight?: number | null;
  dateOfBirth?: string | null;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  surgicalHistory: string[];
  familyHistory: string[];
  smokingStatus?: string | null;
  alcoholUse?: string | null;
  exerciseFrequency?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
}

interface MedicalRecordsResponse {
  records: MedicalRecord[];
  total: number;
  limit: number;
  offset: number;
}

interface HealthProfileResponse {
  profile: HealthProfile;
}

// Fetch medical records
export function useMedicalRecords(
  patientId: string,
  options?: { type?: string; limit?: number; offset?: number }
) {
  return useQuery<MedicalRecordsResponse>({
    queryKey: ["medicalRecords", patientId, options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.type) params.set("type", options.type);
      if (options?.limit) params.set("limit", options.limit.toString());
      if (options?.offset) params.set("offset", options.offset.toString());

      const response = await fetch(
        `/api/patients/${patientId}/medical-records?${params.toString()}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch medical records");
      }

      return response.json();
    },
    enabled: !!patientId,
  });
}

// Fetch health profile
export function useHealthProfile(patientId: string) {
  return useQuery<HealthProfileResponse>({
    queryKey: ["healthProfile", patientId],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${patientId}/health-profile`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch health profile");
      }

      return response.json();
    },
    enabled: !!patientId,
  });
}

// Create medical record
export function useCreateMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patientId,
      data,
    }: {
      patientId: string;
      data: Partial<MedicalRecord>;
    }) => {
      const response = await fetch(`/api/patients/${patientId}/medical-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create medical record");
      }

      return response.json();
    },
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: ["medicalRecords", patientId] });
    },
  });
}

// Update medical record
export function useUpdateMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patientId,
      recordId,
      data,
    }: {
      patientId: string;
      recordId: string;
      data: Partial<MedicalRecord>;
    }) => {
      const response = await fetch(
        `/api/patients/${patientId}/medical-records/${recordId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update medical record");
      }

      return response.json();
    },
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: ["medicalRecords", patientId] });
    },
  });
}

// Update health profile
export function useUpdateHealthProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patientId,
      data,
    }: {
      patientId: string;
      data: Partial<HealthProfile>;
    }) => {
      const response = await fetch(`/api/patients/${patientId}/health-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update health profile");
      }

      return response.json();
    },
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: ["healthProfile", patientId] });
    },
  });
}
