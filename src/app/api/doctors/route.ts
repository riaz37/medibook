import { NextRequest, NextResponse } from "next/server";
import { Gender } from "@/generated/prisma/client";
import { doctorsServerService } from "@/lib/services/server";
import { generateAvatar } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { createDoctorSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requireRole } from "@/lib/server/rbac";
import { createErrorResponse, createServerErrorResponse, handlePrismaError } from "@/lib/utils/api-response";

// GET /api/doctors - Get all doctors (public, but filtered for doctors)
export async function GET(request: NextRequest) {
  try {
    const doctors = await doctorsServerService.getAvailable();

    const doctorsWithCount = doctors.map((doctor: any) => ({
      ...doctor,
      appointmentCount: doctor._count?.appointments || 0,
    }));

    return NextResponse.json(doctorsWithCount);
  } catch (error) {
    console.error("[GET /api/doctors] Error:", error);
    return createServerErrorResponse("Failed to fetch doctors");
  }
}

// POST /api/doctors - Create a new doctor (Admin only - middleware handles auth)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole("admin");
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(createDoctorSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { name, email, phone, speciality, gender, bio } = validation.data;

    const doctor = await doctorsServerService.create({
      name,
      email,
      phone,
      speciality,
      gender: gender as Gender,
      bio: bio || undefined,
      imageUrl: generateAvatar(name, gender as Gender),
    });

    revalidatePath("/admin");

    return NextResponse.json(doctor, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/doctors] Error:", error);

    // Handle Prisma errors
    if (typeof error === "object" && error !== null && "code" in error) {
      return handlePrismaError(error);
    }

    return createServerErrorResponse("Failed to create doctor");
  }
}

