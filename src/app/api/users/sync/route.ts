import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/rbac";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    // In custom auth, user is already in DB; return current user
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
    });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in syncUser API route:", error);
    return NextResponse.json(
      { 
        error: "Failed to sync user",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
