import { NextRequest, NextResponse } from "next/server";
import { Gender } from "@prisma/client";
import prisma from "@/lib/prisma";
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
    
    // Middleware ensures user is authenticated and has doctor/admin role for /api/doctors/* routes
    const { getAuthContext } = await import("@/lib/server/auth-utils");
    const context = await getAuthContext();
    
    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
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

    const currentDoctor = await prisma.doctor.findUnique({
      where: { id },
      select: { email: true },
    });

    if (!currentDoctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    // if email is changing, check if the new email already exists
    if (email && email !== currentDoctor.email) {
      const existingDoctor = await prisma.doctor.findUnique({
        where: { email },
      });

      if (existingDoctor) {
        return NextResponse.json(
          { error: "A doctor with this email already exists" },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (speciality !== undefined) updateData.speciality = speciality;
    if (gender !== undefined) updateData.gender = gender as Gender;
    if (bio !== undefined) updateData.bio = bio;

    const doctor = await prisma.doctor.update({
      where: { id },
      data: updateData,
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

