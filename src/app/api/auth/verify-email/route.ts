import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = verifyEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    const { token } = result.data;

    // Find the verification token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid verification link" },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (verificationToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Verification link has expired. Please request a new one." },
        { status: 400 }
      );
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
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}

// Verify token validity via GET
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token is required" },
        { status: 400 }
      );
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
    console.error("Token validation error:", error);
    return NextResponse.json(
      { valid: false, error: "An error occurred" },
      { status: 500 }
    );
  }
}
