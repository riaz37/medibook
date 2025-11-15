/**
 * Client-safe Authorization Utilities
 * For server-side auth utilities, use @/lib/server/auth-utils
 * 
 * This file re-exports types and provides client-safe utilities only
 */

// Re-export types for client components
export type { AuthContext } from "@/lib/server/auth-utils";

// Re-export server functions via dynamic imports (for backward compatibility)
// Note: These should be imported directly from @/lib/server/auth-utils in server components
export async function getAuthContext(includeDbUser = false) {
  if (typeof window !== "undefined") {
    throw new Error("getAuthContext cannot be used in client components. Use useAuth() hook instead.");
  }
  const { getAuthContext: serverGetAuthContext } = await import("@/lib/server/auth-utils");
  return serverGetAuthContext(includeDbUser);
}

export async function requireAuth() {
  if (typeof window !== "undefined") {
    throw new Error("requireAuth cannot be used in client components.");
  }
  const { requireAuth: serverRequireAuth } = await import("@/lib/server/auth-utils");
  return serverRequireAuth();
}

export async function requireRole(requiredRole: "patient" | "doctor" | "admin") {
  if (typeof window !== "undefined") {
    throw new Error("requireRole cannot be used in client components.");
  }
  const { requireRole: serverRequireRole } = await import("@/lib/server/auth-utils");
  return serverRequireRole(requiredRole);
}

export async function requireAnyRole(requiredRoles: ("patient" | "doctor" | "admin")[]) {
  if (typeof window !== "undefined") {
    throw new Error("requireAnyRole cannot be used in client components.");
  }
  const { requireAnyRole: serverRequireAnyRole } = await import("@/lib/server/auth-utils");
  return serverRequireAnyRole(requiredRoles);
}

export async function requireDoctorOwnership(doctorId: string) {
  if (typeof window !== "undefined") {
    throw new Error("requireDoctorOwnership cannot be used in client components.");
  }
  const { requireDoctorOwnership: serverRequireDoctorOwnership } = await import("@/lib/server/auth-utils");
  return serverRequireDoctorOwnership(doctorId);
}

export async function requireAppointmentAccess(appointmentId: string) {
  if (typeof window !== "undefined") {
    throw new Error("requireAppointmentAccess cannot be used in client components.");
  }
  const { requireAppointmentAccess: serverRequireAppointmentAccess } = await import("@/lib/server/auth-utils");
  return serverRequireAppointmentAccess(appointmentId);
}

