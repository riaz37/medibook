import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { paymentService } from "@/lib/services/payment.service";
import { requirePermission } from "@/lib/server/rbac";
import prisma from "@/lib/prisma";

/**
 * POST /api/payments/confirm
 * Confirm payment immediately after successful Stripe payment
 * This updates the database immediately instead of waiting for webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication and payments.write permission
    const authResult = await requirePermission("payments", "write");
    if ("response" in authResult) {
      return authResult.response;
    }

    const { context } = authResult;
    const body = await request.json();
    const { paymentIntentId, appointmentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Missing required field: paymentIntentId" },
        { status: 400 }
      );
    }

    // Verify payment intent exists and succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: `Payment intent status is ${paymentIntent.status}, not succeeded` },
        { status: 400 }
      );
    }

    // Get charge ID
    const chargeId = paymentIntent.latest_charge as string;
    if (!chargeId) {
      return NextResponse.json(
        { error: "Payment intent missing charge ID" },
        { status: 400 }
      );
    }

    // Verify appointment exists and user has access (if appointmentId provided)
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          user: {
            select: { id: true },
          },
        },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 }
        );
      }

      // Verify user is the patient for this appointment (unless admin)
      if (context.role !== "admin") {
        if (appointment.userId !== context.userId) {
          return NextResponse.json(
            { error: "Forbidden: You can only confirm payments for your own appointments" },
            { status: 403 }
          );
        }
      }
    }

    // Confirm payment (updates database immediately)
    const payment = await paymentService.confirmPayment(
      paymentIntentId,
      chargeId,
      appointmentId
    );

    // Auto-confirm appointment when payment is confirmed (no doctor acceptance needed)
    if (payment.appointment && payment.appointment.status === "PENDING") {
      try {
        const { appointmentsServerService } = await import("@/lib/services/server/appointments.service");
        await appointmentsServerService.updateStatus(
          payment.appointmentId,
          "CONFIRMED"
        );
      } catch (error) {
        console.error("Failed to auto-confirm appointment after payment confirmation:", error);
        // Don't fail the request if confirmation fails - payment is still processed
      }
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        patientPaid: payment.patientPaid,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to confirm payment" },
      { status: 500 }
    );
  }
}

