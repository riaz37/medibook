import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { paymentService } from "@/lib/services/payment.service";
import { commissionService } from "@/lib/services/commission.service";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/server/rbac";

/**
 * POST /api/payments/create-intent
 * Create a Stripe Payment Intent for an appointment
 * Requires: payments.write permission (patients can create payment intents)
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
    const { appointmentId, appointmentPrice, doctorId } = body;

    if (!appointmentId || !appointmentPrice || !doctorId) {
      return NextResponse.json(
        { error: "Missing required fields: appointmentId, appointmentPrice, doctorId" },
        { status: 400 }
      );
    }

    // Verify appointment exists and user has access
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { 
        doctor: true,
        user: {
          select: { clerkId: true },
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
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: context.userId },
        select: { id: true },
      });

      if (!dbUser || appointment.userId !== dbUser.id) {
        return NextResponse.json(
          { error: "Forbidden: You can only create payment intents for your own appointments" },
          { status: 403 }
        );
      }
    }

    // Check if payment already exists
    const existingPayment = await paymentService.getPaymentByAppointmentId(appointmentId);
    if (existingPayment && existingPayment.patientPaid) {
      return NextResponse.json(
        { error: "Payment already processed for this appointment" },
        { status: 400 }
      );
    }

    // Calculate commission
    const commissionPercentage = await commissionService.getCommissionPercentage();
    const { commissionAmount } = commissionService.calculateCommission(
      appointmentPrice,
      commissionPercentage
    );

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(appointmentPrice * 100), // Convert to cents
      currency: "usd",
      metadata: {
        appointmentId,
        doctorId,
        appointmentPrice: appointmentPrice.toString(),
        commissionAmount: commissionAmount.toString(),
        commissionPercentage: commissionPercentage.toString(),
      },
      description: `Appointment with ${appointment.doctor.name}`,
    });

    // Create or update payment record (handles existing payments gracefully)
    await paymentService.processAppointmentPayment(
      appointmentId,
      appointmentPrice,
      doctorId,
      paymentIntent.id
    );

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

