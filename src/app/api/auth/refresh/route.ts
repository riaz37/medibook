import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 }
      );
    }

    const result = await refreshAccessToken(refreshToken);

    if ("error" in result) {
      // Clear cookies on error
      cookieStore.delete("session");
      cookieStore.delete("refresh_token");
      
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // Set new cookies
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    cookieStore.set("session", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: sessionExpiresAt,
      sameSite: "lax",
      path: "/",
    });

    cookieStore.set("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: refreshExpiresAt,
      sameSite: "strict",
      path: "/api/auth",
    });

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
