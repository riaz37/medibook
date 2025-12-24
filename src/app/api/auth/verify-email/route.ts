import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/lib/utils/validation";
import { createErrorResponse, createServerErrorResponse, createNotFoundResponse } from "@/lib/utils/api-response";
import { z } from "zod";

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validation = validateRequest(verifyEmailSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { token } = validation.data;

    // Find the verification token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      return createErrorResponse("Invalid verification link", 400, undefined, "INVALID_TOKEN");
    }

    // Check if token has expired
    if (verificationToken.expiresAt < new Date()) {
      return createErrorResponse("Verification link has expired. Please request a new one.", 400, undefined, "TOKEN_EXPIRED");
    }

    // Check if already verified
    if (verificationToken.verifiedAt) {
      return NextResponse.json({
        success: true,
        message: "Email has already been verified",
        alreadyVerified: true,
      });
    }

    // Verify the email
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      }),
      prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { verifiedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("[POST /api/auth/verify-email] Error:", error);
    return createServerErrorResponse("Failed to verify email");
  }
}

// Verify token validity via GET
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return createErrorResponse("Token is required", 400, undefined, "MISSING_TOKEN");
    }

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ valid: false, error: "Invalid token" });
    }

    if (verificationToken.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, error: "Token has expired" });
    }

    if (verificationToken.verifiedAt) {
      return NextResponse.json({ 
        valid: true, 
        alreadyVerified: true,
        message: "Email already verified" 
      });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("[GET /api/auth/verify-email] Error:", error);
    return createServerErrorResponse("Failed to validate token");
  }
}
