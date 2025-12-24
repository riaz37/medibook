import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { emailService } from "@/lib/services/email.service";
import { z } from "zod";
import crypto from "crypto";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["patient", "doctor"]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = signUpSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.issues }, { status: 400 });
    }

    const { email, password, firstName, lastName, role } = result.data;

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    
    // Find Role ID
    const roleRecord = await prisma.role.findUnique({ where: { name: role } });
    
    if (!roleRecord) {
        return NextResponse.json({ error: "System error: Role not found" }, { status: 500 });
    }

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        roleId: roleRecord.id,
        userRole: role.toUpperCase() as any, // Legacy enum mapping
        emailVerified: false,
      },
    });

    // Create email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        token: verificationToken,
        expiresAt,
      },
    });

    // Send verification email (don't wait for it)
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
    emailService.sendEmailVerification(
      user.email,
      verificationLink,
      firstName
    ).catch(err => console.error("Failed to send verification email:", err));

    // Create session
    await createSession(user.id);

    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: role,
        emailVerified: false,
      },
      message: "Account created! Please check your email to verify your account."
    });
  } catch (error) {
    console.error("Sign up error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
