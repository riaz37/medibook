/**
 * Unified RBAC System
 * 
 * This is the single source of truth for all RBAC operations.
 * Consolidates functionality from rbac.ts and auth-utils.ts into one consistent API.
 * 
 * Architecture:
 * - Database (Prisma) is the single source of truth for roles
 * - Clerk session claims are used as a performance optimization (fast path)
 * - Falls back to database if role is missing in session claims
 * - Automatically syncs role back to Clerk metadata for future requests
 * - Permission-based access control for fine-grained authorization
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/constants/permissions";
import type { Role, Permission, PermissionCheckResult } from "@/lib/types/rbac";
import type { UserRole } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

/**
 * Auth context with user information
 */
export interface AuthContext {
  userId: string;
  clerkUserId: string;
  role: Role;
  doctorId: string | null;
  dbUser?: {
    id: string;
    role: UserRole;
    doctorProfile?: { id: string } | null;
  };
}

/**
 * Simple role check (Clerk docs pattern)
 * Checks role from session claims only - fast, no database fallback
 * Use this for simple role checks when you know the role is in session claims
 * 
 * For cases needing database fallback, use getUserRoleFromSession() instead
 */
export async function checkRole(role: Role): Promise<boolean> {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role === role;
}

/**
 * Get user role from Clerk session claims
 * Falls back to database if role is missing in session claims (database is source of truth)
 * Returns null if user is not authenticated or has no role
 */
export async function getUserRoleFromSession(): Promise<Role | null> {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return null;
    }
    
    const metadata = sessionClaims?.metadata as { role?: string; doctorId?: string } | undefined;
    let role = (metadata?.role as Role) || null;
    
    // Fallback to database if role is missing in session claims
    // Database is the single source of truth for roles
    if (!role) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { 
          role: true,
          doctorProfile: { select: { id: true } }
        },
      });
      
      if (!dbUser || !dbUser.role) {
        return null;
      }
      
      // Convert database role to session role format
      role = (dbUser.role === "ADMIN" ? "admin" : 
              dbUser.role === "DOCTOR" ? "doctor" : "patient") as Role;
      
      // Get doctorId from profile if available
      const doctorId = dbUser.doctorProfile?.id || null;
      
      // Sync metadata back to Clerk asynchronously (non-blocking)
      syncMetadataToClerk(userId, role, doctorId).catch((error) => {
        console.error("Failed to sync role to Clerk metadata:", error);
      });
    }
    
    // Validate role is one of the allowed values
    if (role === "patient" || role === "doctor" || role === "admin") {
      return role;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting role from session:", error);
    return null;
  }
}

/**
 * Sync role and doctorId to Clerk metadata (non-blocking helper)
 */
async function syncMetadataToClerk(
  clerkUserId: string,
  role: Role,
  doctorId?: string | null
): Promise<void> {
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    
    const metadata: { role: string; doctorId?: string } = { role };
    if (doctorId) {
      metadata.doctorId = doctorId;
    }
    
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: metadata,
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Get authenticated user context
 * Returns full auth context with optional database user
 */
export async function getAuthContext(
  includeDbUser = false
): Promise<AuthContext | null> {
  try {
    const { userId: clerkUserId, sessionClaims } = await auth();

    if (!clerkUserId) {
      return null;
    }

    const metadata = sessionClaims?.metadata as { role?: string; doctorId?: string } | undefined;
    let role = (metadata?.role as "patient" | "doctor" | "admin") || null;
    let doctorId = metadata?.doctorId || null;

    // Fallback to database if role is missing in session claims
    if (!role) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        include: { doctorProfile: { select: { id: true } } },
      });

      if (!dbUser || !dbUser.role) {
        return null;
      }

      // Convert database role to session role format
      role = dbUser.role === "ADMIN" ? "admin" :
             dbUser.role === "DOCTOR" ? "doctor" : "patient";
      
      // Get doctorId from profile if available
      if (dbUser.doctorProfile) {
        doctorId = dbUser.doctorProfile.id;
      }

      // Sync metadata back to Clerk asynchronously (non-blocking)
      syncMetadataToClerk(clerkUserId, role, doctorId).catch((error) => {
        console.error("Failed to sync role to Clerk metadata:", error);
      });
    }

    const context: AuthContext = {
      userId: clerkUserId,
      clerkUserId,
      role,
      doctorId,
    };

    // Only fetch DB user if explicitly needed (for business logic)
    if (includeDbUser) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        include: { doctorProfile: { select: { id: true } } },
      });

      if (dbUser) {
        context.dbUser = {
          id: dbUser.id,
          role: dbUser.role,
          doctorProfile: dbUser.doctorProfile,
        };
      }
    }

    return context;
  } catch (error) {
    console.error("Error getting auth context:", error);
    return null;
  }
}

/**
 * Require authentication
 * Returns auth context if authenticated, or error response if not
 */
export async function requireAuth(): Promise<
  { context: AuthContext } | { response: NextResponse }
> {
  const context = await getAuthContext();

  if (!context) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return { context };
}

/**
 * Check if user has a specific permission
 */
export async function checkPermission(
  resource: Permission["resource"],
  action: Permission["action"]
): Promise<PermissionCheckResult> {
  const role = await getUserRoleFromSession();
  
  if (!role) {
    return {
      allowed: false,
      reason: "User not authenticated or has no role",
    };
  }
  
  const allowed = hasPermission(role, resource, action);
  
  return {
    allowed,
    reason: allowed ? undefined : `Role '${role}' does not have permission to ${action} ${resource}`,
  };
}

/**
 * Require a specific permission
 * Returns auth context if allowed, or error response if not
 */
export async function requirePermission(
  resource: Permission["resource"],
  action: Permission["action"]
): Promise<{ context: AuthContext } | { response: NextResponse }> {
  const authResult = await requireAuth();
  
  if ("response" in authResult) {
    return authResult;
  }

  const permissionCheck = await checkPermission(resource, action);
  
  if (!permissionCheck.allowed) {
    return {
      response: NextResponse.json(
        { error: "Forbidden", reason: permissionCheck.reason },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Require a specific role
 * Returns auth context if allowed, or error response if not
 * 
 * Returns both new format (context) and legacy format (role, userId) for backward compatibility
 */
export async function requireRole(
  requiredRole: Role
): Promise<
  | { context: AuthContext; role: Role; userId: string }
  | { response: NextResponse }
> {
  const authResult = await requireAuth();

  if ("response" in authResult) {
    return authResult;
  }

  const { context } = authResult;

  // Admin has access to everything
  if (context.role === "admin") {
    return { 
      context, 
      role: context.role, 
      userId: context.userId 
    };
  }

  if (context.role !== requiredRole) {
    return {
      response: NextResponse.json(
        { error: `Forbidden: ${requiredRole} role required` },
        { status: 403 }
      ),
    };
  }

  return { 
    context, 
    role: context.role, 
    userId: context.userId 
  };
}

/**
 * Require any of the specified roles
 * Returns auth context if allowed, or error response if not
 * 
 * Returns both new format (context) and legacy format (role, userId) for backward compatibility
 */
export async function requireAnyRole(
  requiredRoles: Role[]
): Promise<
  | { context: AuthContext; role: Role; userId: string }
  | { response: NextResponse }
> {
  const authResult = await requireAuth();

  if ("response" in authResult) {
    return authResult;
  }

  const { context } = authResult;

  // Admin has access to everything
  if (context.role === "admin") {
    return { 
      context, 
      role: context.role, 
      userId: context.userId 
    };
  }

  if (!requiredRoles.includes(context.role)) {
    return {
      response: NextResponse.json(
        { error: `Forbidden: One of these roles required: ${requiredRoles.join(", ")}` },
        { status: 403 }
      ),
    };
  }

  return { 
    context, 
    role: context.role, 
    userId: context.userId 
  };
}

/**
 * Require doctor ownership
 * Ensures user is the owner of the doctor profile or is an admin
 */
export async function requireDoctorOwnership(
  doctorId: string
): Promise<{ context: AuthContext } | { response: NextResponse }> {
  const authResult = await requireAuth();

  if ("response" in authResult) {
    return authResult;
  }

  const { context } = authResult;

  // Admin has access to everything
  if (context.role === "admin") {
    return { context };
  }

  // Doctor must own the profile
  if (context.role === "doctor" && context.doctorId === doctorId) {
    return { context };
  }

  return {
    response: NextResponse.json(
      { error: "Forbidden: You can only access your own doctor profile" },
      { status: 403 }
    ),
  };
}

/**
 * Require appointment access
 * Ensures user is the patient, doctor, or admin for the appointment
 */
export async function requireAppointmentAccess(
  appointmentId: string
): Promise<{ context: AuthContext } | { response: NextResponse }> {
  const authResult = await requireAuth();

  if ("response" in authResult) {
    return authResult;
  }

  const { context } = authResult;

  // Admin has access to everything
  if (context.role === "admin") {
    return { context };
  }

  // Check appointment ownership
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      userId: true,
      doctorId: true,
    },
  });

  if (!appointment) {
    return {
      response: NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      ),
    };
  }

  // Get user's database ID for comparison
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: context.userId },
    select: { id: true },
  });

  if (!dbUser) {
    return {
      response: NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      ),
    };
  }

  // Check if user is patient or doctor for this appointment
  const isPatient = appointment.userId === dbUser.id;
  const isDoctor = context.role === "doctor" && context.doctorId === appointment.doctorId;

  if (isPatient || isDoctor) {
    return { context };
  }

  return {
    response: NextResponse.json(
      { error: "Forbidden: You can only access your own appointments" },
      { status: 403 }
    ),
  };
}

/**
 * Validate role transition
 * Ensures role changes follow business rules
 */
export function validateRoleTransition(
  oldRole: UserRole,
  newRole: UserRole,
  changedByRole: Role
): { valid: boolean; reason?: string } {
  // Only admins can change roles
  if (changedByRole !== "admin") {
    return {
      valid: false,
      reason: "Only admins can change user roles",
    };
  }
  
  // Prevent demoting admins (security measure)
  if (oldRole === "ADMIN" && newRole !== "ADMIN") {
    return {
      valid: false,
      reason: "Cannot demote admin users",
    };
  }
  
  // Prevent promoting to admin via role change (should be via email whitelist)
  if (newRole === "ADMIN" && oldRole !== "ADMIN") {
    return {
      valid: false,
      reason: "Admin role can only be assigned via email whitelist",
    };
  }
  
  // All other transitions are valid
  return { valid: true };
}

/**
 * Convert Prisma UserRole to Clerk role format (lowercase)
 */
export function userRoleToRole(userRole: UserRole): Role {
  return userRole.toLowerCase() as Role;
}

/**
 * Convert Clerk role format to Prisma UserRole
 */
export function roleToUserRole(role: Role): UserRole {
  return role.toUpperCase() as UserRole;
}
