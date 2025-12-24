import { NextRequest, NextResponse } from "next/server";
import { refundService } from "@/lib/services/refund.service";
import { appointmentsServerService } from "@/lib/services/server";
import { requireAuth } from "@/lib/server/rbac";
import prisma from "@/lib/prisma";
import { createErrorResponse, createNotFoundResponse, createForbiddenResponse, createServerErrorResponse } from "@/lib/utils/api-response";

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

    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    // Get appointment
    const appointment = await appointmentsServerService.findUnique(id, {
      payment: true,
      user: true,
      doctor: true,
    });

    if (!appointment) {
      return createNotFoundResponse("Appointment");
    }

    // Check authorization
    if (context.role === "patient") {
      if (appointment.userId !== context.userId) {
        return createForbiddenResponse("You can only cancel your own appointments");
      }
    }

    // Only verified doctors can cancel appointments (not doctor_pending)
    if (context.role === "doctor" && appointment.doctorId !== context.doctorId) {
      return createForbiddenResponse("You can only cancel appointments for your own patients");
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
    return createServerErrorResponse("Failed to cancel appointment");
  }
}
