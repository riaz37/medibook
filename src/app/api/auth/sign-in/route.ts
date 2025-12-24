import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { validateRequest } from "@/lib/utils/validation";
import { createErrorResponse, createServerErrorResponse } from "@/lib/utils/api-response";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validation = validateRequest(signInSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { role: true }
    });

    if (!user || !user.passwordHash) {
      return createErrorResponse("Invalid credentials", 401, undefined, "INVALID_CREDENTIALS");
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      return createErrorResponse("Invalid credentials", 401, undefined, "INVALID_CREDENTIALS");
    }

    // Create session (this will use effective role in JWT)
    await createSession(user.id);
    
    if (!user.role) {
      console.error("[POST /api/auth/sign-in] User role not found for user:", user.id);
      return createServerErrorResponse("User role not found", "MISSING_ROLE");
    }

    // Return the actual role (already set correctly in database)
    const effectiveRole = user.role.name;

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: effectiveRole } });
  } catch (error) {
    console.error("[POST /api/auth/sign-in] Error:", error);
    return createServerErrorResponse("Failed to sign in");
  }
}
