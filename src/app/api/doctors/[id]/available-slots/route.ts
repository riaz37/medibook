import { NextRequest, NextResponse } from "next/server";
import { doctorsServerService } from "@/lib/services/server";
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
    const duration = searchParams.get("duration");

    // Validate query parameters
    const queryValidation = validateQuery(availableSlotsQuerySchema, {
      date: date || undefined,
      duration: duration || undefined,
    });
    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const { date: validatedDate, duration: validatedDuration } = queryValidation.data;

    // Verify doctor exists and is verified
    const isVerified = await doctorsServerService.isVerified(id);
    if (!isVerified) {
      return NextResponse.json(
        { error: "Doctor not found or not verified" },
        { status: 404 }
      );
    }

    const slots = await doctorsConfigService.getAvailableTimeSlots(id, validatedDate, validatedDuration);
    return NextResponse.json(slots);
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}

