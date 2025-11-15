"use server";

/**
 * Server-only Role Utilities
 * Uses Clerk session claims (no DB query needed)
 */

import { Roles } from "../../../types/globals";
import { auth } from "@clerk/nextjs/server";

/**
 * Check if the current user has a specific role
 * Uses Clerk session claims (no DB query needed)
 */
export const checkRole = async (role: Roles): Promise<boolean> => {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role === role;
};

/**
 * Get the current user's role from session
 */
export const getRole = async (): Promise<Roles | null> => {
  const { sessionClaims } = await auth();
  return (sessionClaims?.metadata?.role as Roles) || null;
};

/**
 * Get the current user's doctor ID from session metadata
 */
export const getDoctorId = async (): Promise<string | null> => {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.doctorId || null;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = async (roles: Roles[]): Promise<boolean> => {
  const userRole = await getRole();
  if (!userRole) return false;
  
  // Admin has access to everything
  if (userRole === "admin") return true;
  
  return roles.includes(userRole);
};

