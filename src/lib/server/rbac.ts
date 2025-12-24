import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role, Permission, RolePermissions } from "@/lib/types/rbac";
import { UserRole } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { rolePermissions } from "@/lib/constants/permissions";

export type AuthContext = {
  userId: string;
  role: Role;
  doctorId?: string | null;
  dbUser?: any;
};

/**
 * Check if the current user has a specific role
 */
export async function checkRole(role: Role): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // Check if user has the role (using the new role relation)
  if (user.role && user.role.name === role) return true;
  
  // Fallback to legacy role enum for migration
  // Map UserRole enum to Role string
  const legacyRole = user.userRole.toLowerCase() as Role;
  return legacyRole === role;
}

/**
 * Get the current user's role from session/DB
 */
export async function getUserRoleFromSession(): Promise<Role | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role) {
    return user.role.name as Role;
  }
  
  return user.userRole.toLowerCase() as Role;
}

/**
 * Get full auth context
 */
export async function getAuthContext(includeDbUser = false): Promise<AuthContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const role = user.role?.name || user.userRole.toLowerCase();
  let doctorId: string | null = null;

  if (role === "doctor") {
    const doctorProfile = await prisma.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    doctorId = doctorProfile?.id || null;
  }

  const context: AuthContext = {
    userId: user.id,
    role: role as Role,
    doctorId,
  };

  if (includeDbUser) {
    context.dbUser = user;
  }

  return context;
}

/**
 * Require authentication
 */
export async function requireAuth(): Promise<{ context: AuthContext } | { response: NextResponse }> {
  const context = await getAuthContext();
  if (!context) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { context };
}

/**
 * Require specific role
 */
export async function requireRole(role: Role): Promise<{ context: AuthContext } | { response: NextResponse }> {
  const context = await getAuthContext();
  if (!context) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (context.role !== role && context.role !== "admin") {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { context };
}

/**
 * Require any of the specified roles
 */
export async function requireAnyRole(roles: Role[]): Promise<{ context: AuthContext } | { response: NextResponse }> {
  const context = await getAuthContext();
  if (!context) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!roles.includes(context.role) && context.role !== "admin") {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { context };
}

/**
 * Check permission based on rolePermissions mapping
 */
export async function checkPermission(resource: Permission["resource"], action: Permission["action"]): Promise<boolean> {
  const role = await getUserRoleFromSession();
  if (!role) return false;
  if (role === "admin") return true;

  const permissions: RolePermissions = rolePermissions;
  const allowed = permissions[role].some((perm) => perm.resource === resource && perm.action === action);
  return allowed;
}

/**
 * Require permission
 */
export async function requirePermission(
  resource: Permission["resource"],
  action: Permission["action"]
): Promise<{ context: AuthContext } | { response: NextResponse }> {
  const context = await getAuthContext();
  if (!context) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (context.role !== "admin") {
    const allowed = rolePermissions[context.role].some((perm) => perm.resource === resource && perm.action === action);
    if (!allowed) {
      return {
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }
  }
  return { context };
}

/**
 * Sync user role (Used for admin actions)
 * This is now a database update instead of Clerk sync
 */
export async function syncUserRole(
  userId: string,
  role: Role,
  doctorId?: string | null
): Promise<void> {
  // Map Role string to UserRole enum for legacy support
  const userRoleEnum = role.toUpperCase() as UserRole;
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      userRole: userRoleEnum, // Update legacy column
      // We would also update roleId here if we had the Role ID
    },
  });
  
  // Also find the Role record and link it if it exists
  const roleRecord = await prisma.role.findUnique({
    where: { name: role },
  });
  
  if (roleRecord) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        roleId: roleRecord.id,
      },
    });
  }
}

/**
 * Validate role transition
 */
export function validateRoleTransition(
  oldRole: UserRole,
  newRole: UserRole,
  changedByRole: Role
): { valid: boolean; reason?: string } {
  if (changedByRole !== "admin") {
    return { valid: false, reason: "Only admin can change roles" };
  }
  if (oldRole === "ADMIN" && newRole !== "ADMIN") {
    return { valid: false, reason: "Admin cannot be demoted" };
  }
  return { valid: true };
}

/**
 * Require access to a specific appointment
 * Checks that the user has access to the appointment (own appointment or admin)
 */
export async function requireAppointmentAccess(appointmentId: string): Promise<{ context: AuthContext } | { response: NextResponse }> {
  const context = await getAuthContext();
  if (!context) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { userId: true, doctorId: true },
  });

  if (!appointment) {
    return {
      response: NextResponse.json({ error: "Appointment not found" }, { status: 404 }),
    };
  }

  // Admin can access all appointments
  if (context.role === "admin") {
    return { context };
  }

  // Patient can only access their own appointments
  if (context.role === "patient" && appointment.userId !== context.userId) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  // Doctor can only access appointments they are assigned to
  if (context.role === "doctor" && appointment.doctorId !== context.doctorId) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { context };
}

/**
 * Convert role string to UserRole enum
 */
export function roleToUserRole(role: Role): UserRole {
  return role.toUpperCase() as UserRole;
}
