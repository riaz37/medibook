import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/server/rbac";

/**
 * GET /api/patients/payments
 * Get payment history for the authenticated patient
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole("patient");
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    if (context.role !== "patient") {
      return NextResponse.json(
        { error: "Forbidden - Patient access required" },
        { status: 403 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get payments for this patient's appointments
    const payments = await prisma.appointmentPayment.findMany({
      where: {
        appointment: {
          userId: user.id,
        },
      },
      include: {
        appointment: {
          select: {
            id: true,
            date: true,
            time: true,
            status: true,
            reason: true,
            appointmentTypeId: true,
            doctor: {
              select: {
                id: true,
                name: true,
                speciality: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to last 100 payments
    });

    // Fetch appointment types separately
    const paymentsWithTypes = await Promise.all(
      payments.map(async (payment) => {
        let appointmentType = null;
        if (payment.appointment?.appointmentTypeId) {
          appointmentType = await prisma.doctorAppointmentType.findUnique({
            where: { id: payment.appointment.appointmentTypeId },
            select: {
              id: true,
              name: true,
              price: true,
            },
          });
        }
        return {
          ...payment,
          appointment: payment.appointment
            ? {
                ...payment.appointment,
                appointmentType,
              }
            : null,
        };
      })
    );

    return NextResponse.json(paymentsWithTypes);
  } catch (error) {
    console.error("Error fetching patient payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

