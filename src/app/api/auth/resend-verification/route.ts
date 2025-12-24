import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";
import { emailService } from "@/lib/services/email.service";

const resendSchema = z.object({
  email: z.string().email().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = resendSchema.safeParse(body);

    let email: string | undefined;

    // Try to get email from session first
    const session = await getSession();
    if (session?.user) {
      email = session.user.email;
    } else if (result.success && result.data.email) {
      email = result.data.email;
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a verification link will be sent.",
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "Email is already verified.",
        alreadyVerified: true,
      });
    }

    // Rate limiting: Check if a token was sent in the last 2 minutes
    const recentToken = await prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) },
      },
    });

    if (recentToken) {
      return NextResponse.json(
        { error: "Please wait before requesting another verification email" },
        { status: 429 }
      );
    }

    // Delete old tokens
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate new token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        token,
        expiresAt,
      },
    });

    // Send verification email
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    await emailService.sendEmailVerification(
      user.email,
      verificationLink,
      user.firstName || undefined
    );

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
