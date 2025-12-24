import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/**
 * Get current authenticated user
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleName = user.role?.name || user.userRole.toLowerCase();

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: roleName,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
