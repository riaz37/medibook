/**
 * Server Services Barrel Export
 * Central export point for all server-side services.
 * 
 * IMPORTANT: These services are server-only and use Prisma directly.
 * They should NEVER be imported in client components.
 * 
 * Use these services in:
 * - API routes (src/app/api/**)
 * - Server Actions ("use server")
 * - Server Components
 */

export * from "./base-server.service";
export * from "./appointments.service";
export * from "./prescriptions.service";
export * from "./doctors.service";
export * from "./users.service";

// Export service instances
export { appointmentsServerService } from "./appointments.service";
export { prescriptionsServerService } from "./prescriptions.service";
export { doctorsServerService } from "./doctors.service";
export { usersServerService } from "./users.service";

