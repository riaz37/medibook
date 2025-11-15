/**
 * Role-based access control utilities
 */

import { UserRole } from "@prisma/client";

export type Role = UserRole;

/**
 * Check if user has required role
 */
export function hasRole(userRole: Role | null | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;
  
  // Admin has access to everything
  if (userRole === "ADMIN") return true;
  
  // Exact match
  return userRole === requiredRole;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(userRole: Role | null | undefined, requiredRoles: Role[]): boolean {
  if (!userRole) return false;
  
  // Admin has access to everything
  if (userRole === "ADMIN") return true;
  
  return requiredRoles.includes(userRole);
}

/**
 * Get redirect path based on role
 */
export function getRoleRedirectPath(role: Role | null | undefined): string {
  if (!role) return "/select-role";
  
  switch (role) {
    case "DOCTOR":
      return "/doctor/dashboard";
    case "ADMIN":
      return "/admin";
    case "PATIENT":
    default:
      return "/dashboard";
  }
}

