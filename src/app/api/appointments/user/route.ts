import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { appointmentsServerService, usersServerService } from "@/lib/services/server";

function transformAppointment(appointment: any) {
  return {
    ...appointment,
    patientName: `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim(),
    patientEmail: appointment.user.email,
    doctorName: appointment.doctor.name,
    doctorImageUrl: appointment.doctor.imageUrl || "",
    date: appointment.date.toISOString().split("T")[0],
  };
}

// GET /api/appointments/user - Get user's appointments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // If userId is provided directly (e.g., from VAPI), verify it exists
    // Otherwise, use authenticated user
    let user;
    if (userId) {
      user = await usersServerService.findUnique(userId);
      if (!user) {
        return NextResponse.json(
          { error: "User not found. Please ensure your account is properly set up." },
          { status: 404 }
        );
      }
    } else {
      const { requireAuth } = await import("@/lib/server/rbac");
      const authResult = await requireAuth();
      if ("response" in authResult) {
        return authResult.response;
      }
      
      const { context } = authResult;
      // Get DB user ID from Clerk user ID
      user = await usersServerService.findUniqueByClerkId(context.clerkUserId);
      if (!user) {
        return NextResponse.json(
          { error: "User not found. Please ensure your account is properly set up." },
          { status: 404 }
        );
      }
    }

    const appointments = await appointmentsServerService.getByUser(user.id, {
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        doctor: { select: { name: true, imageUrl: true } },
      },
    });

    const transformedAppointments = appointments.map(transformAppointment);

    return NextResponse.json(transformedAppointments);
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch user appointments" },
      { status: 500 }
    );
  }
}

