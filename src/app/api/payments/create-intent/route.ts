import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { paymentService } from "@/lib/services/payment.service";
import { commissionService } from "@/lib/services/commission.service";
import prisma from "@/lib/prisma";

/**
 * POST /api/payments/create-intent
 * Create a Stripe Payment Intent for an appointment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, appointmentPrice, doctorId } = body;

    if (!appointmentId || !appointmentPrice || !doctorId) {
      return NextResponse.json(
        { error: "Missing required fields: appointmentId, appointmentPrice, doctorId" },
        { status: 400 }
      );
    }

    // Verify appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
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

