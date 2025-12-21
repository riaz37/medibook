import { NextRequest, NextResponse } from "next/server";
import { appointmentsServerService } from "@/lib/services/server";
import { requireAppointmentAccess } from "@/lib/server/rbac";
import { z } from "zod";

const rescheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM format (24-hour)"),
});

// POST /api/appointments/[id]/reschedule - Reschedule an appointment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check appointment access (handles authorization)
    const accessResult = await requireAppointmentAccess(id);
    if ("response" in accessResult) {
      return accessResult.response;
    }

    const body = await request.json();
    const validation = rescheduleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { date, time } = validation.data;

    // Reschedule the appointment using service (includes all business logic validation)
    const rescheduledAppointment = await appointmentsServerService.reschedule(id, { date, time });

    // Transform response
    const appointment = rescheduledAppointment as any;
    return NextResponse.json({
      ...appointment,
      patientName: `${appointment.user?.firstName || ""} ${appointment.user?.lastName || ""}`.trim(),
      patientEmail: appointment.user?.email,
      doctorName: appointment.doctor?.name,
      doctorImageUrl: appointment.doctor?.imageUrl || "",
      date: appointment.date?.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    return NextResponse.json(
      { error: "Failed to reschedule appointment" },
      { status: 500 }
    );
  }
}

