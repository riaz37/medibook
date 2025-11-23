import { NextRequest, NextResponse } from "next/server";
import { appointmentsServerService, doctorsServerService } from "@/lib/services/server";

// GET /api/appointments/booked-slots - Get booked time slots for a doctor on a date
export async function GET(request: NextRequest) {
  try {
    // This endpoint is public (used for booking flow), but we can optionally verify auth
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: "Doctor ID and date are required" },
        { status: 400 }
      );
    }

    // Verify doctor exists and is verified
    const isVerified = await doctorsServerService.isVerified(doctorId);
    if (!isVerified) {
      return NextResponse.json(
        { error: "Doctor not found or not verified" },
        { status: 404 }
      );
    }

    // Get booked slots using service
    const bookedSlots = await appointmentsServerService.getBookedSlots(doctorId, date);

    return NextResponse.json(bookedSlots);
  } catch (error) {
    console.error("Error fetching booked time slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch booked time slots" },
      { status: 500 }
    );
  }
}

