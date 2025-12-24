import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAuthContext } from "@/lib/server/rbac";
import { createUnauthorizedResponse, createServerErrorResponse } from "@/lib/utils/api-response";

/**
 * Get current authenticated user
 * Returns effective role (accounts for doctorProfile)
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.role) {
      return createUnauthorizedResponse();
    }

    // Return the actual role (already set correctly in database)
    const effectiveRole = user.role.name;

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: effectiveRole,
    });
  } catch (error) {
    console.error("[GET /api/auth/me] Error:", error);
    return createServerErrorResponse("Failed to get current user");
  }
}
