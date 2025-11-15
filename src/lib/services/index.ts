/**
 * Services Barrel Export
 * Central export point for all services
 */

export * from "./base.service";
export * from "./api-client.service";
export * from "./auth.service";
export * from "./doctors.service";
export * from "./appointments.service";
export * from "./users.service";

// Export service instances
export { apiClient } from "./api-client.service";
export { doctorsService } from "./doctors.service";
export { appointmentsService } from "./appointments.service";
export { usersService } from "./users.service";

// Re-export types for convenience
export type {
  Appointment,
  AppointmentStatus,
  BookAppointmentInput,
  UpdateAppointmentStatusInput,
  AppointmentStats,
  Doctor,
  CreateDoctorInput,
  UpdateDoctorInput,
  User,
  AuthUser,
} from "@/lib/types";

