import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/server/auth-utils";

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
    const context = await getAuthContext();

    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
          include: {
            appointmentType: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to last 100 payments
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching doctor payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

