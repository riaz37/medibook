import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role, Permission, RolePermissions } from "@/lib/types/rbac";
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
  if (!user || !user.role) return false;
  
  return user.role.name === role;
}

/**
 * Get the current user's role from session/DB
 */
export async function getUserRoleFromSession(): Promise<Role | null> {
  const user = await getCurrentUser();
  if (!user || !user.role) return null;

  return user.role.name as Role;
}

/**
 * Get full auth context
 * 
 * Role-based access:
 * - patient: Regular patients
 * - doctor_pending: Doctors pending admin approval (can access doctor routes but limited)
 * - doctor: Verified doctors with full access
 * - admin: Administrators
 */
export async function getAuthContext(includeDbUser = false): Promise<AuthContext | null> {
  const user = await getCurrentUser();
  if (!user || !user.role) return null;

  const role = user.role.name as Role;
  let doctorId: string | null = null;

  // If user has doctor_pending or doctor role, get doctor profile ID
  if (role === "doctor_pending" || role === "doctor") {
    const doctorProfile = await prisma.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (doctorProfile) {
      doctorId = doctorProfile.id;
    }
  }

  const context: AuthContext = {
    userId: user.id,
    role: role,
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
  // Admin has access to everything
  if (context.role === "admin") {
    return { context };
  }
  // For "doctor" role requirement, also allow "doctor_pending"
  if (role === "doctor" && (context.role === "doctor" || context.role === "doctor_pending")) {
    return { context };
  }
  // Exact role match
  if (context.role !== role) {
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
  // Admin has access to everything
  if (context.role === "admin") {
    return { context };
  }
  // If "doctor" is in required roles, also allow "doctor_pending"
  const allowedRoles = roles.includes("doctor") 
    ? [...roles, "doctor_pending"] 
    : roles;
  
  if (!allowedRoles.includes(context.role)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { context };
}

/**
 * Check permission based on rolePermissions mapping
 * Uses effective role (accounts for doctorProfile)
 */
export async function checkPermission(resource: Permission["resource"], action: Permission["action"]): Promise<boolean> {
  const context = await getAuthContext();
  if (!context) return false;
  if (context.role === "admin") return true;

  const permissions: RolePermissions = rolePermissions;
  const allowed = permissions[context.role].some((perm) => perm.resource === resource && perm.action === action);
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

