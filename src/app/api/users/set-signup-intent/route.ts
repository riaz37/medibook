import { NextResponse } from "next/server";

/**
 * API route to set signup intent
 * This is now deprecated as role is set during registration
 * Kept for backwards compatibility
 */
export async function POST(req: Request) {
  return NextResponse.json({ 
    success: true, 
    message: "Role is now set during registration" 
  });
}
