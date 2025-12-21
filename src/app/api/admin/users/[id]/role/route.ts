import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server/rbac";
import prisma from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { UserRole } from "@/generated/prisma/client";
import { validateRoleTransition, roleToUserRole } from "@/lib/server/rbac";

/**
 * PUT /api/admin/users/[id]/role
 * 
 * Update user role
 * Admin only
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin role
    const authResult = await requireRole("admin");
    if ("response" in authResult) {
      return authResult.response;
    }

    const { userId: adminUserId, role: adminRole } = authResult;
    const userId = params.id;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { newRole, reason } = body;

    if (!newRole) {
      return NextResponse.json(
        { error: "New role is required" },
        { status: 400 }
      );
    }

    // Validate role value
    const validRoles = ["PATIENT", "DOCTOR", "ADMIN"];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const newUserRole = newRole as UserRole;

    // Validate role transition
    const validation = validateRoleTransition(
      user.role,
      newUserRole,
      adminRole
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason },
        { status: 400 }
      );
    }

    // Prevent changing to admin role (should be via email whitelist)
    if (newUserRole === "ADMIN" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin role can only be assigned via email whitelist" },
        { status: 400 }
      );
    }

    // Update user role
    const oldRole = user.role;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: newUserRole,
      },
    });

    // Update Clerk metadata
    try {
      const client = await clerkClient();
      const roleForClerk = newUserRole === "ADMIN" ? "admin" : 
                          newUserRole === "DOCTOR" ? "doctor" : "patient";
      
      // Get doctorId if user is a doctor
      let doctorId: string | null = null;
      if (newUserRole === "DOCTOR") {
        const doctorProfile = await prisma.doctor.findUnique({
          where: { userId: userId },
          select: { id: true },
        });
        doctorId = doctorProfile?.id || null;
      }
      
      const metadataToSync: { role: string; doctorId?: string } = {
        role: roleForClerk,
      };
      
      if (doctorId) {
        metadataToSync.doctorId = doctorId;
      }
      
      await client.users.updateUserMetadata(user.clerkId, {
        publicMetadata: metadataToSync,
      });
    } catch (error) {
      console.error("Error updating Clerk metadata:", error);
      // Continue even if metadata update fails
    }

    // Log role change
    await prisma.roleChangeAudit.create({
      data: {
        userId: user.id,
        oldRole,
        newRole: newUserRole,
        changedBy: adminUserId,
        reason: reason || undefined,
      },
    });

    return NextResponse.json({
      message: "User role updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
