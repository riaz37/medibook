import { NextRequest, NextResponse } from "next/server";
import { Gender } from "@/generated/prisma/client";
import { doctorsServerService } from "@/lib/services/server";
import { updateDoctorSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";

// PUT /api/doctors/[id] - Update a doctor (Admin or doctor themselves)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;
    
    const { requireAuth } = await import("@/lib/server/rbac");
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;
    
    // Check if user is admin or owns this doctor profile
    if (context.role !== "admin" && context.doctorId !== id) {
      return NextResponse.json(
        { error: "Forbidden: You can only update your own profile" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(updateDoctorSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { name, email, phone, speciality, gender, bio } = validation.data;

    const doctor = await doctorsServerService.update(id, {
      name,
      email,
      phone,
      speciality,
      gender: gender as Gender,
      bio: bio || undefined,
    });

    return NextResponse.json(doctor);
  } catch (error) {
    console.error("Error updating doctor:", error);
    return NextResponse.json(
      { error: "Failed to update doctor" },
      { status: 500 }
    );
  }
}

