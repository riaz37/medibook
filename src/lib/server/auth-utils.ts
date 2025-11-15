"use server";

/**
 * Server-only Authorization Utilities
 * Helper functions for role-based access control in API routes and server components
 * Uses Clerk session claims (no DB queries needed for role checks)
 */

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getRole, getDoctorId, hasAnyRole } from "@/lib/server/roles";

export interface AuthContext {
  userId: string;
  clerkUserId: string;
  role: "patient" | "doctor" | "admin";
  doctorId: string | null;
  dbUser?: {
    id: string;
    role: UserRole;
    doctorProfile?: { id: string } | null;
  };
}

/**
 * Get authenticated user from Clerk session (fast - no DB query)
 * Optionally fetch DB user if needed for business logic
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
    const role = (metadata?.role as "patient" | "doctor" | "admin") || null;
    const doctorId = metadata?.doctorId || null;

    if (!role) {
      return null;
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
 * Require authentication - returns auth context or error response
 */
export async function requireAuth(): Promise<{ context: AuthContext } | { response: NextResponse }> {
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
 * Require specific role (uses Clerk session - no DB query)
 */
export async function requireRole(
  requiredRole: "patient" | "doctor" | "admin"
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

  if (context.role !== requiredRole) {
    return {
      response: NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return { context };
}

/**
 * Require any of the specified roles (uses Clerk session - no DB query)
 */
export async function requireAnyRole(
  requiredRoles: ("patient" | "doctor" | "admin")[]
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

  if (!requiredRoles.includes(context.role)) {
    return {
      response: NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return { context };
}

/**
 * Require doctor ownership of a resource (uses Clerk session - no DB query)
 */
export async function requireDoctorOwnership(
  doctorId: string
): Promise<{ context: AuthContext } | { response: NextResponse }> {
  const authResult = await requireAnyRole(["doctor", "admin"]);
  
  if ("response" in authResult) {
    return authResult;
  }

  const { context } = authResult;

  // Admin can access any doctor's resources
  if (context.role === "admin") {
    return { context };
  }

  // Doctor must own the resource (check from session metadata)
  if (context.doctorId !== doctorId) {
    return {
      response: NextResponse.json(
        { error: "Forbidden: You can only access your own resources" },
        { status: 403 }
      ),
    };
  }

  return { context };
}

/**
 * Check if user owns an appointment (patient or doctor)
 * Requires DB user for appointment ownership check
 */
export async function requireAppointmentAccess(
  appointmentId: string
): Promise<{ context: AuthContext } | { response: NextResponse }> {
  // Get auth context with DB user for ownership check
  const context = await getAuthContext(true);
  
  if (!context || !context.dbUser) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  // Admin can access any appointment
  if (context.role === "admin") {
    return { context };
  }

  // Get appointment to check ownership
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { userId: true, doctorId: true },
  });

  if (!appointment) {
    return {
      response: NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      ),
    };
  }

  // Patient can access their own appointments
  if (context.role === "patient" && appointment.userId === context.dbUser.id) {
    return { context };
  }

  // Doctor can access their own appointments
  if (context.role === "doctor" && context.doctorId === appointment.doctorId) {
    return { context };
  }

  return {
    response: NextResponse.json(
      { error: "Forbidden: You don't have access to this appointment" },
      { status: 403 }
    ),
  };
}

