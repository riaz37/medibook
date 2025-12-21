import { NextRequest, NextResponse } from "next/server";
import { usersServerService } from "@/lib/services/server";
import { updateUserProfileSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requireAuth } from "@/lib/server/rbac";

/**
 * GET /api/users/profile - Get current user profile
 */
export async function GET() {
  try {
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    const user = await usersServerService.findUniqueByClerkId(context.clerkUserId, {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    } as any);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/profile - Update current user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(updateUserProfileSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { firstName, lastName, phone } = validation.data;

    // Get user ID first
    const user = await usersServerService.findUniqueByClerkId(context.clerkUserId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user profile
    const updatedUser = await usersServerService.update(user.id, {
      firstName: firstName !== undefined ? firstName : undefined,
      lastName: lastName !== undefined ? lastName : undefined,
      phone: phone !== undefined ? phone : undefined,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}

