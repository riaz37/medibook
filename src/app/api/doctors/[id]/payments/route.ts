import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/server/rbac";

/**
 * GET /api/doctors/[id]/payments
 * Get payment history for a doctor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    // Verify authorization - doctor can only see their own payments
    if (context.role === "doctor" && context.doctorId !== id) {
      return NextResponse.json(
        { error: "Forbidden - Can only view your own payments" },
        { status: 403 }
      );
    }

    // Get payments for this doctor
    const payments = await prisma.appointmentPayment.findMany({
      where: { doctorId: id },
      include: {
        appointment: {
          select: {
            id: true,
            appointmentTypeId: true,
            date: true,
            time: true,
            status: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
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
    console.error("Error fetching doctor payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

