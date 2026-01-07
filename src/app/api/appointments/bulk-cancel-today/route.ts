import { NextRequest, NextResponse } from "next/server";
import { refundService } from "@/lib/services/refund.service";
import { appointmentsServerService } from "@/lib/services/server";
import { requireRole } from "@/lib/server/rbac";
import prisma from "@/lib/prisma";
import { createErrorResponse, createForbiddenResponse, createServerErrorResponse } from "@/lib/utils/api-response";

/**
 * POST /api/appointments/bulk-cancel-today
 * Cancel all appointments for today (doctor only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reason } = body;

    // Require doctor role
    const authResult = await requireRole("doctor");
    if ("response" in authResult) {
      return authResult.response;
    }

    const { context } = authResult;

    if (!context.doctorId) {
      return createForbiddenResponse("Doctor profile not found");
    }

    // Get today's date range (start and end of today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Get all today's appointments for this doctor that are not already cancelled
    const todaysAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: context.doctorId,
        date: {
          gte: today,
          lte: endOfToday,
        },
        status: {
          not: "CANCELLED",
        },
      },
      include: {
        payment: true,
      },
    });

    if (todaysAppointments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No appointments to cancel for today",
        cancelledCount: 0,
      });
    }

    // Cancel each appointment and process refunds
    const results = await Promise.allSettled(
      todaysAppointments.map(async (appointment) => {
        // Process refund if payment exists
        if (appointment.payment && appointment.payment.patientPaid) {
          try {
            await refundService.handleCancellation(
              appointment.id,
              reason || "Bulk cancelled: All today's appointments cancelled by doctor"
            );
          } catch (error) {
            console.error(`Error processing refund for appointment ${appointment.id}:`, error);
            // Continue with cancellation even if refund fails
          }
        }

        // Cancel appointment
        await appointmentsServerService.cancel(
          appointment.id,
          reason || "Bulk cancelled: All today's appointments cancelled by doctor"
        );

        return appointment.id;
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      message: `Successfully cancelled ${successful} appointment(s)${failed > 0 ? `. ${failed} failed.` : ""}`,
      cancelledCount: successful,
      failedCount: failed,
      totalCount: todaysAppointments.length,
    });
  } catch (error) {
    console.error("Error bulk cancelling today's appointments:", error);
    return createServerErrorResponse("Failed to cancel today's appointments");
  }
}

