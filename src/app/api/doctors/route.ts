import { NextRequest, NextResponse } from "next/server";
import { Gender } from "@/generated/prisma/client";
import { doctorsServerService } from "@/lib/services/server";
import { generateAvatar } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { createDoctorSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";

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
    console.log("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}

// POST /api/doctors - Create a new doctor (Admin only - middleware handles auth)
export async function POST(request: NextRequest) {
  try {
    const { requireRole } = await import("@/lib/server/rbac");
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

    return NextResponse.json(doctor);
  } catch (error: any) {
    console.error("Error creating doctor:", error);

    // handle unique constraint violation (email already exists)
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A doctor with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create doctor" },
      { status: 500 }
    );
  }
}

