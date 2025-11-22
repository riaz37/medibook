/**
 * Centralized Query Keys Factory
 * Provides consistent query key generation across the application
 * 
 * Benefits:
 * - Type-safe query keys
 * - Consistent naming
 * - Easy refactoring
 * - Prevents typos
 */

export const queryKeys = {
  // Appointments
  appointments: {
    all: ["appointments"] as const,
    lists: () => [...queryKeys.appointments.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.appointments.lists(), filters] as const,
    details: () => [...queryKeys.appointments.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.appointments.details(), id] as const,
    user: (userId?: string) => [...queryKeys.appointments.all, "user", userId] as const,
    doctor: (doctorId?: string) => [...queryKeys.appointments.all, "doctor", doctorId] as const,
    bookedSlots: (doctorId: string, date: string) => [...queryKeys.appointments.all, "bookedSlots", doctorId, date] as const,
    stats: () => [...queryKeys.appointments.all, "stats"] as const,
  },

  // Doctors
  doctors: {
    all: ["doctors"] as const,
    lists: () => [...queryKeys.doctors.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.doctors.lists(), filters] as const,
    details: () => [...queryKeys.doctors.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.doctors.details(), id] as const,
    available: () => [...queryKeys.doctors.all, "available"] as const,
    admin: () => [...queryKeys.doctors.all, "admin"] as const,
    verification: (doctorId: string) => [...queryKeys.doctors.detail(doctorId), "verification"] as const,
    config: (doctorId: string) => [...queryKeys.doctors.detail(doctorId), "config"] as const,
    workingHours: (doctorId: string) => [...queryKeys.doctors.detail(doctorId), "workingHours"] as const,
    appointmentTypes: (doctorId: string) => [...queryKeys.doctors.detail(doctorId), "appointmentTypes"] as const,
    availableSlots: (doctorId: string, date: string) => [...queryKeys.doctors.detail(doctorId), "availableSlots", date] as const,
  },

  // Admin
  admin: {
    all: ["admin"] as const,
    verifications: (status?: "PENDING" | "APPROVED" | "REJECTED") => {
      if (status) {
        return [...queryKeys.admin.all, "verifications", status] as const;
      }
      return [...queryKeys.admin.all, "verifications"] as const;
    },
  },

  // Users
  users: {
    all: ["users"] as const,
    current: () => [...queryKeys.users.all, "current"] as const,
    sync: () => [...queryKeys.users.all, "sync"] as const,
  },

  // Payments
  payments: {
    all: ["payments"] as const,
    patient: () => [...queryKeys.payments.all, "patient"] as const,
    doctor: (doctorId: string) => [...queryKeys.payments.all, "doctor", doctorId] as const,
    billing: (doctorId: string, month?: number, year?: number) => {
      const key = [...queryKeys.payments.all, "billing", doctorId] as const;
      if (month !== undefined && year !== undefined) {
        return [...key, month, year] as const;
      }
      return key;
    },
  },

  // Analytics
  analytics: {
    all: ["analytics"] as const,
    trends: (period: string) => [...queryKeys.analytics.all, "trends", period] as const,
    revenue: (period?: string) => {
      const key = [...queryKeys.analytics.all, "revenue"] as const;
      return period ? [...key, period] as const : key;
    },
  },

  // Prescriptions
  prescriptions: {
    all: ["prescriptions"] as const,
    lists: () => [...queryKeys.prescriptions.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.prescriptions.lists(), filters] as const,
    details: () => [...queryKeys.prescriptions.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.prescriptions.details(), id] as const,
    doctor: (params?: { status?: string; patientId?: string; limit?: number; offset?: number }) => {
      const key = [...queryKeys.prescriptions.all, "doctor"] as const;
      return params ? [...key, params] as const : key;
    },
    patient: (params?: { status?: string; limit?: number; offset?: number }) => {
      const key = [...queryKeys.prescriptions.all, "patient"] as const;
      return params ? [...key, params] as const : key;
    },
  },
} as const;

/**
 * Helper to invalidate related queries
 */
export function getRelatedQueryKeys(key: readonly unknown[]) {
  const [root, ...rest] = key;
  
  // Return all keys that start with the same root
  return {
    all: [root] as const,
    lists: [root, "list"] as const,
    details: [root, "detail"] as const,
  };
}

