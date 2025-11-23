import { NextRequest, NextResponse } from "next/server";
import { refundService } from "@/lib/services/refund.service";
import { appointmentsServerService } from "@/lib/services/server";
import { getAuthContext } from "@/lib/server/auth-utils";
import prisma from "@/lib/prisma";

/**
 * POST /api/appointments/[id]/cancel
 * Cancel an appointment and process refunds
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    // Get auth context
    const context = await getAuthContext();
    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get appointment
    const appointment = await appointmentsServerService.findUnique(id, {
      payment: true,
      user: true,
      doctor: true,
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check authorization
    if (context.role === "patient") {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: context.clerkUserId },
        select: { id: true },
      });
      if (dbUser && appointment.userId !== dbUser.id) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    if (context.role === "doctor" && appointment.doctorId !== context.doctorId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Process refund if payment exists
    let refundResult = null;
    if ((appointment as any).payment && (appointment as any).payment.patientPaid) {
      try {
        refundResult = await refundService.handleCancellation(
          id,
          reason || "Cancelled by user"
        );
      } catch (error) {
        console.error("Error processing refund:", error);
        // Continue with cancellation even if refund fails
      }
    }

    // Cancel appointment using service
    await appointmentsServerService.cancel(id, reason);

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
      refund: refundResult,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
