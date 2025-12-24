import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";
import { createErrorResponse, createValidationErrorResponse, createServerErrorResponse } from "@/lib/utils/api-response";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return createValidationErrorResponse(details);
    }

    const { token, password } = result.data;

    // Find the password reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return createErrorResponse("Invalid or expired reset link", 400, undefined, "INVALID_TOKEN");
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      return createErrorResponse("Reset link has expired. Please request a new one.", 400, undefined, "TOKEN_EXPIRED");
    }

    // Check if token has already been used
    if (resetToken.usedAt) {
      return createErrorResponse("This reset link has already been used", 400, undefined, "TOKEN_USED");
    }

    // Hash the new password
    const passwordHash = await hashPassword(password);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all existing sessions for security
      prisma.session.deleteMany({
        where: { userId: resetToken.userId },
      }),
      // Revoke all refresh tokens
      prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Password reset successful. Please sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return createServerErrorResponse("Failed to reset password");
  }
}

// Verify token validity (for checking before showing reset form)
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

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ valid: false, error: "Invalid token" });
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, error: "Token has expired" });
    }

    if (resetToken.usedAt) {
      return NextResponse.json({ valid: false, error: "Token has already been used" });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Token validation error:", error);
    return createServerErrorResponse("Failed to validate token");
  }
}
