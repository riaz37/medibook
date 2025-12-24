import { NextRequest, NextResponse } from "next/server";
import { appointmentsServerService, usersServerService } from "@/lib/services/server";
import { requireAuth } from "@/lib/server/rbac";
import { createErrorResponse, createServerErrorResponse, createNotFoundResponse } from "@/lib/utils/api-response";

function transformAppointment(appointment: any) {
  return {
    ...appointment,
    patientName: `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim(),
    patientEmail: appointment.user.email,
    doctorName: appointment.doctor.name,
    doctorImageUrl: appointment.doctor.imageUrl || "",
    doctorSpeciality: appointment.doctor.speciality || null,
    date: appointment.date.toISOString().split("T")[0],
    price: appointment.payment?.appointmentPrice ? Number(appointment.payment.appointmentPrice) : appointment.appointmentType?.price ? Number(appointment.appointmentType.price) : null,
    paymentStatus: appointment.payment?.status || null,
    patientPaid: appointment.payment?.patientPaid || false,
    refunded: appointment.payment?.refunded || false,
    hasPrescription: !!appointment.prescription,
    prescriptionId: appointment.prescription?.id || null,
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
        return createNotFoundResponse("User");
      }
    } else {
      const authResult = await requireAuth();
      if ("response" in authResult) {
        return authResult.response;
      }
      
      const { context } = authResult;
      // Get user by ID
      user = await usersServerService.findUnique(context.userId);
      if (!user) {
        return createNotFoundResponse("User");
      }
    }

    const appointments = await appointmentsServerService.getByUser(user.id, {
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        doctor: { select: { name: true, imageUrl: true, speciality: true } },
        payment: {
          select: {
            id: true,
            appointmentPrice: true,
            status: true,
            patientPaid: true,
            refunded: true,
            refundAmount: true,
          },
        },
        prescription: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    const transformedAppointments = appointments.map(transformAppointment);

    return NextResponse.json(transformedAppointments);
  } catch (error) {
    console.error("[GET /api/appointments/user] Error:", error);
    return createServerErrorResponse("Failed to fetch user appointments");
  }
}

