/**
 * Services Barrel Export
 * Central export point for all CLIENT-SIDE services (HTTP-based).
 * 
 * IMPORTANT: For server-side services (Prisma-based), use:
 * import { ... } from "@/lib/services/server"
 * 
 * Client services are for use in client components and make HTTP requests.
 * Server services are for use in API routes, server actions, and server components.
 */

export * from "./base.service";
export * from "./api-client.service";
export * from "./doctors.service";
export * from "./appointments.service";
export * from "./users.service";
export * from "./admin.service";
export * from "./upload.service";
// vapi.service is server-only (uses Prisma) - import directly from "@/lib/services/vapi.service" in server components/API routes
// pdf.service is server-only (uses Prisma) - import directly from "@/lib/services/pdf.service" in server components/API routes
export * from "./prescriptions.service";

// Export service instances
export { apiClient } from "./api-client.service";
export { doctorsService } from "./doctors.service";
export { appointmentsService } from "./appointments.service";
export { usersService } from "./users.service";
export { adminService } from "./admin.service";
export { uploadService } from "./upload.service";
// vapiService is server-only (uses Prisma) - import directly from "@/lib/services/vapi.service" in server components/API routes
// export { vapiService } from "./vapi.service";
// pdfService is server-only (uses Prisma) - import directly from "@/lib/services/pdf.service" in server components/API routes
// export { pdfService } from "./pdf.service";
export { prescriptionsService } from "./prescriptions.service";

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
