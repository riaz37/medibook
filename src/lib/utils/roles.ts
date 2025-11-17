/**
 * Client-safe Role Utilities
 * For server-side role utilities, use @/lib/server/roles
 * 
 * This file re-exports server functions via dynamic imports for backward compatibility
 */

import { Roles } from "../../../types/globals";

/**
 * Check if the current user has a specific role
 * @deprecated Use checkRole from @/lib/server/roles in server components
 */
export const checkRole = async (role: Roles): Promise<boolean> => {
  if (typeof window !== "undefined") {
    throw new Error("checkRole cannot be used in client components.");
  }
  const { checkRole: serverCheckRole } = await import("@/lib/server/roles");
  return serverCheckRole(role);
};

/**
 * Get the current user's role from session
 * @deprecated Use getRole from @/lib/server/roles in server components
 */
export const getRole = async (): Promise<Roles | null> => {
  if (typeof window !== "undefined") {
    throw new Error("getRole cannot be used in client components.");
  }
  const { getRole: serverGetRole } = await import("@/lib/server/roles");
  return serverGetRole();
};

/**
 * Get the current user's doctor ID from session metadata
 * @deprecated Use getDoctorId from @/lib/server/roles in server components
 */
export const getDoctorId = async (): Promise<string | null> => {
  if (typeof window !== "undefined") {
    throw new Error("getDoctorId cannot be used in client components.");
  }
  const { getDoctorId: serverGetDoctorId } = await import("@/lib/server/roles");
  return serverGetDoctorId();
};

/**
 * Check if user has any of the specified roles
 * @deprecated Use hasAnyRole from @/lib/server/roles in server components
 */
export const hasAnyRole = async (roles: Roles[]): Promise<boolean> => {
  if (typeof window !== "undefined") {
    throw new Error("hasAnyRole cannot be used in client components.");
  }
  const { hasAnyRole: serverHasAnyRole } = await import("@/lib/server/roles");
  return serverHasAnyRole(roles);
};

