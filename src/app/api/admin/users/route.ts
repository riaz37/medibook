import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server/rbac";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/users
 * 
 * Get all users with their roles
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    const authResult = await requireRole("admin");
    if ("response" in authResult) {
      return authResult.response;
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
