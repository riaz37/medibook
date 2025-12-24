import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server/rbac";
import prisma from "@/lib/prisma";
import type { Role } from "@/lib/types/rbac";
import { createErrorResponse, createNotFoundResponse, createForbiddenResponse, createServerErrorResponse } from "@/lib/utils/api-response";

/**
 * PUT /api/admin/users/[id]/role
 * 
 * Update user role
 * Admin only
 * 
 * Allows changing roles between: patient, doctor_pending, doctor
 * Does NOT allow creating new admins (admin role is protected)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin role
    const authResult = await requireRole("admin");
    if ("response" in authResult) {
      return authResult.response;
    }

    const { context } = authResult;
    const { id: userId } = await params;
    const body = await request.json();
    const { newRole, reason } = body;

    // Validate newRole
    const allowedRoles: Role[] = ["patient", "doctor_pending", "doctor"];
    if (!newRole || !allowedRoles.includes(newRole)) {
      return createErrorResponse(
        `Invalid role. Allowed roles: ${allowedRoles.join(", ")}`,
        400,
        undefined,
        "INVALID_ROLE"
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return createNotFoundResponse("User");
    }

    // Prevent changing admin roles
    if (user.role.name === "admin") {
      return createForbiddenResponse("Cannot change admin role");
    }

    // Prevent creating new admins
    if (newRole === "admin") {
      return createForbiddenResponse("Admin role cannot be assigned through this endpoint. Use the create-admin script.");
    }

    // If role is the same, return success
    if (user.role.name === newRole) {
      return NextResponse.json({
        message: "Role unchanged",
        user: {
          id: user.id,
          email: user.email,
          role: user.role.name,
        },
      });
    }

    // Get the new role
    const targetRole = await prisma.role.findUnique({
      where: { name: newRole },
    });

    if (!targetRole) {
      return createNotFoundResponse(`Role '${newRole}'`);
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roleId: targetRole.id,
      },
      include: {
        role: true,
      },
    });

    // If changing to/from doctor role, update doctor profile verification status
    if (newRole === "doctor" && user.role.name === "doctor_pending") {
      // Approving doctor - mark as verified
      await prisma.doctor.updateMany({
        where: { userId: userId },
        data: { isVerified: true },
      });
    } else if (newRole === "doctor_pending" && user.role.name === "doctor") {
      // Reverting to pending - mark as unverified
      await prisma.doctor.updateMany({
        where: { userId: userId },
        data: { isVerified: false },
      });
    }

    // Log the role change (reason is optional)
    console.log(`[PUT /api/admin/users/[id]/role] Role changed for user ${userId}: ${user.role.name} -> ${newRole}${reason ? ` (Reason: ${reason})` : ""} by admin ${context.userId}`);

    return NextResponse.json({
      message: "User role updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role.name,
      },
    });
  } catch (error) {
    console.error("[PUT /api/admin/users/[id]/role] Error:", error);
    return createServerErrorResponse("Failed to update user role");
  }
}
