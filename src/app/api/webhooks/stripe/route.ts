import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { paymentService } from "@/lib/services/payment.service";
import { payoutService } from "@/lib/services/payout.service";
import { headers } from "next/headers";
import Stripe from "stripe";

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: `Webhook Error: ${error}` },
      { status: 400 }
    );
  }

  try {
    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case "transfer.created":
        await handleTransferCreated(event.data.object as Stripe.Transfer);
        break;

      case "transfer.failed":
        await handleTransferFailed(event.data.object as Stripe.Transfer);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;
  const chargeId = paymentIntent.latest_charge as string;

  if (!chargeId) {
    console.error("No charge ID in payment intent");
    return;
  }

  await paymentService.confirmPayment(paymentIntentId, chargeId);

  // Get payment to schedule payout and send email
  const payment = await paymentService.getPaymentByIntentId(paymentIntentId);
  if (payment && payment.appointment) {
    // Hold payout until after appointment
    await paymentService.holdDoctorPayout(
      payment.id,
      payment.appointment.date
    );

    // Send confirmation email after payment
    try {
      const { emailService } = await import("@/lib/services/email.service");
      await emailService.sendAppointmentConfirmation(payment.appointmentId);
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
      // Don't fail webhook if email fails
    }
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  await paymentService.markPaymentFailed(paymentIntent.id);
}

/**
 * Handle refund
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  // This will be handled by the refund service
  // The refund service will update the payment record
  console.log("Charge refunded:", charge.id);
}

/**
 * Handle successful transfer (doctor payout)
 */
async function handleTransferCreated(transfer: Stripe.Transfer) {
  await payoutService.confirmPayout(transfer.id);
}

/**
 * Handle failed transfer
 */
async function handleTransferFailed(transfer: Stripe.Transfer) {
  await payoutService.markPayoutFailed(transfer.id);
}

