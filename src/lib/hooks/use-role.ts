/**
 * Client-side role checking hook
 * Uses Clerk's useAuth hook to get role from session
 */

"use client";

import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";
import type { Role } from "@/lib/types/rbac";
import { hasPermission } from "@/lib/constants/permissions";
import type { Permission } from "@/lib/types/rbac";

/**
 * Get current user's role from Clerk session
 */
export function useRole(): Role | null {
  const { sessionClaims } = useAuth();
  
  const role = useMemo(() => {
    if (!sessionClaims?.metadata) {
      return null;
    }
    
    const roleValue = (sessionClaims.metadata as { role?: string })?.role;
    
    if (!roleValue) {
      return null;
    }
    
    // Validate role is one of the allowed values
    if (roleValue === "patient" || roleValue === "doctor" || roleValue === "admin") {
      return roleValue;
    }
    
    return null;
  }, [sessionClaims]);
  
  return role;
}

/**
 * Check if current user has a specific permission
 */
export function usePermission(
  resource: Permission["resource"],
  action: Permission["action"]
): boolean {
  const role = useRole();
  
  if (!role) {
    return false;
  }
  
  return hasPermission(role, resource, action);
}

/**
 * Check if current user has a specific role
 */
export function useHasRole(requiredRole: Role): boolean {
  const role = useRole();
  
  if (!role) {
    return false;
  }
  
  // Admin has access to everything
  if (role === "admin") {
    return true;
  }
  
  return role === requiredRole;
}

/**
 * Check if current user has any of the specified roles
 */
export function useHasAnyRole(requiredRoles: Role[]): boolean {
  const role = useRole();
  
  if (!role) {
    return false;
  }
  
  // Admin has access to everything
  if (role === "admin") {
    return true;
  }
  
  return requiredRoles.includes(role);
}
