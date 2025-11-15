import { NextRequest, NextResponse } from "next/server";
import { syncUserDirect } from "@/lib/server/users";

export async function POST(request: NextRequest) {
  try {
    // Middleware ensures user is authenticated
    const syncedUser = await syncUserDirect();
    
    if (!syncedUser) {
      return NextResponse.json(
        { error: "Failed to sync user" },
        { status: 500 }
      );
    }

    return NextResponse.json(syncedUser);
  } catch (error) {
    console.error("Error in syncUser API route", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}

