import { NextRequest, NextResponse } from "next/server";
import { Gender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateAvatar } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { createDoctorSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";

// GET /api/doctors - Get all doctors (public, but filtered for doctors)
export async function GET(request: NextRequest) {
  try {
    const doctors = await prisma.doctor.findMany({
      where: {
        isVerified: true, // Only show verified doctors to public
      },
      include: {
        _count: { select: { appointments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const doctorsWithCount = doctors.map((doctor) => ({
      ...doctor,
      appointmentCount: doctor._count.appointments,
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
    // Middleware ensures user is admin for this route
    const { getAuthContext } = await import("@/lib/utils/auth-utils");
    const context = await getAuthContext();

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(createDoctorSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { name, email, phone, speciality, gender, bio } = validation.data;

    const doctor = await prisma.doctor.create({
      data: {
        name,
        email,
        phone,
        speciality,
        gender: gender as Gender,
        bio,
        imageUrl: generateAvatar(name, gender as Gender),
      },
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

