import { NextRequest, NextResponse } from "next/server";
import { usersServerService } from "@/lib/services/server";
import { updateUserProfileSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requireAuth } from "@/lib/server/rbac";
import { createNotFoundResponse, createServerErrorResponse } from "@/lib/utils/api-response";

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

    const user = await usersServerService.findUnique(context.userId, {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return createNotFoundResponse("User");
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[GET /api/users/profile] Error:", error);
    return createServerErrorResponse("Failed to fetch user profile");
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
    const user = await usersServerService.findUnique(context.userId);
    if (!user) {
      return createNotFoundResponse("User");
    }

    // Update user profile
    const updatedUser = await usersServerService.update(user.id, {
      firstName: firstName !== undefined && firstName !== null ? firstName : undefined,
      lastName: lastName !== undefined && lastName !== null ? lastName : undefined,
      phone: phone !== undefined && phone !== null ? phone : undefined,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[PUT /api/users/profile] Error:", error);
    return createServerErrorResponse("Failed to update user profile");
  }
}
