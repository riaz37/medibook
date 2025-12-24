import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { emailService } from "@/lib/services/email.service";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link.",
      });
    }

    // Delete any existing password reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create password reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send password reset email
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    await emailService.sendPasswordResetEmail(
      user.email,
      resetLink,
      user.firstName || undefined
    );

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
