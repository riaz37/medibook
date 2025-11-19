import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { paymentService } from "@/lib/services/payment.service";
import { payoutService } from "@/lib/services/payout.service";
import { headers } from "next/headers";
import { createLogger } from "@/lib/logger";
import Stripe from "stripe";

const logger = createLogger("stripe-webhook");

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
    logger.error("Stripe webhook secret missing");
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
    logger.error("Stripe webhook signature verification failed", { error });
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

      case "transfer.paid":
        // Transfer was successfully paid out to doctor
        // This is already handled by transfer.created, but we log it for completeness
        logger.info("Transfer paid event received", { transferId: (event.data.object as Stripe.Transfer).id });
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Error processing Stripe webhook", {
      error: error instanceof Error ? error.message : "Unknown error",
      eventType: event.type,
    });
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
    logger.warn("payment_intent.succeeded missing charge ID", { paymentIntentId });
    return;
  }

  const appointmentId =
    (paymentIntent.metadata?.appointmentId as string | undefined) || undefined;

  const payment = await paymentService.confirmPayment(
    paymentIntentId,
    chargeId,
    appointmentId
  );

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
      logger.error("Failed to send confirmation email after payment", {
        error: error instanceof Error ? error.message : "Unknown error",
        appointmentId: payment.appointmentId,
      });
      // Don't fail webhook if email fails
    }
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const appointmentId =
    (paymentIntent.metadata?.appointmentId as string | undefined) || undefined;
  await paymentService.markPaymentFailed(paymentIntent.id, appointmentId);
}

/**
 * Handle refund
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  // This will be handled by the refund service
  // The refund service will update the payment record
  logger.info("Charge refunded event received", { chargeId: charge.id });
}

/**
 * Handle successful transfer (doctor payout)
 */
async function handleTransferCreated(transfer: Stripe.Transfer) {
  await payoutService.confirmPayout(transfer.id);
}

/**
 * Handle failed transfer (doctor payout failed)
 */
async function handleTransferFailed(transfer: Stripe.Transfer) {
  logger.error("Transfer failed", {
    transferId: transfer.id,
    amount: transfer.amount,
    destination: transfer.destination,
    failureCode: transfer.failure_code,
    failureMessage: transfer.failure_message,
  });

  await payoutService.markPayoutFailed(transfer.id);
}

