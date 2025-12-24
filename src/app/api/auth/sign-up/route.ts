import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { emailService } from "@/lib/services/email.service";
import { validateRequest } from "@/lib/utils/validation";
import { createErrorResponse, createValidationErrorResponse, createServerErrorResponse, handlePrismaError } from "@/lib/utils/api-response";
import { z } from "zod";
import crypto from "crypto";

const signUpSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["patient", "doctor"]).default("patient"),
  // Doctor-specific fields
  speciality: z.string().optional(),
  licenseNumber: z.string().optional(),
  yearsOfExperience: z.number().optional(),
  bio: z.string().optional(),
}).refine((data) => {
  if (data.role === "doctor") {
    return data.speciality && data.speciality.trim().length > 0;
  }
  return true;
}, {
  message: "Speciality is required for doctors",
  path: ["speciality"],
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validation = validateRequest(signUpSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { email, password, firstName, lastName, role, speciality, licenseNumber, yearsOfExperience, bio } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return createErrorResponse("User already exists", 409, undefined, "DUPLICATE_EMAIL");
    }

    const passwordHash = await hashPassword(password);
    
    // Determine role: doctors get "doctor_pending", others get "patient"
    const userRole = role === "doctor" ? "doctor_pending" : "patient";
    
    const roleRecord = await prisma.role.upsert({
      where: { name: userRole },
      update: {},
      create: {
        name: userRole,
        description: userRole === "doctor_pending" 
          ? "Doctor pending admin approval" 
          : "Patient role",
      },
    });

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        roleId: roleRecord.id,
        emailVerified: false,
      },
    });

    // If doctor signup, create doctor profile and application
    if (role === "doctor" && speciality) {
      // Create doctor profile (isVerified will be set to true when admin approves)
      await prisma.doctor.create({
        data: {
          userId: user.id,
          name: `${firstName} ${lastName}`.trim(),
          email: user.email,
          phone: "",
          speciality: speciality.trim(),
          bio: bio?.trim() || null,
          gender: "MALE", // Default, can be updated later
          imageUrl: "",
          isVerified: false, // Will be set to true when role changes to "doctor"
          yearsOfExperience: yearsOfExperience || null,
        },
      });

      // Create doctor application for admin review
      await prisma.doctorApplication.create({
        data: {
          userId: user.id,
          speciality: speciality.trim(),
          licenseNumber: licenseNumber?.trim() || null,
          yearsOfExperience: yearsOfExperience || null,
          bio: bio?.trim() || null,
          status: "PENDING",
        },
      });
    }

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
        role: userRole, // Return the actual role assigned (doctor_pending or patient)
        emailVerified: false,
      },
      message: role === "doctor" 
        ? "Account created! Please check your email to verify your account. Your doctor application is pending admin approval - you'll be notified once approved."
        : "Account created! Please check your email to verify your account."
    });
  } catch (error) {
    console.error("[POST /api/auth/sign-up] Error:", error);
    
    // Handle Prisma errors
    if (typeof error === "object" && error !== null && "code" in error) {
      return handlePrismaError(error);
    }
    
    return createServerErrorResponse("Failed to create account");
  }
}
