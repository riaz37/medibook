import { NextRequest, NextResponse } from "next/server";
import { syncUserDirect } from "@/lib/server/users";
import { requireAuth } from "@/lib/server/rbac";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    // Sync user from Clerk to database
    const syncedUser = await syncUserDirect();
    
    if (!syncedUser) {
      console.error(`Failed to sync user: ${context.userId}`);
      return NextResponse.json(
        { error: "Failed to sync user. User may not exist in Clerk or missing email." },
        { status: 500 }
      );
    }

    return NextResponse.json(syncedUser);
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

