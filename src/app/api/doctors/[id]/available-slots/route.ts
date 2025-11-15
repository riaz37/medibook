import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { doctorsConfigService } from "@/lib/services/doctors-config.service";
import { availableSlotsQuerySchema } from "@/lib/validations";
import { validateQuery } from "@/lib/utils/validation";

// GET /api/doctors/[id]/available-slots?date=YYYY-MM-DD (public for booking)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    // Validate query parameters
    const queryValidation = validateQuery(availableSlotsQuerySchema, { date: date || undefined });
    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const { date: validatedDate } = queryValidation.data;

    // Verify doctor exists and is verified
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: { isVerified: true },
    });

    if (!doctor || !doctor.isVerified) {
      return NextResponse.json(
        { error: "Doctor not found or not verified" },
        { status: 404 }
      );
    }

    const slots = await doctorsConfigService.getAvailableTimeSlots(id, validatedDate);
    return NextResponse.json(slots);
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}

