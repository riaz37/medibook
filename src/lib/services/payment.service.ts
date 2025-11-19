import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { commissionService } from "./commission.service";
import { RefundType } from "@prisma/client";

/**
 * Payment Service
 * Handles patient payments, commission calculation, and doctor payouts
 */
export class PaymentService {
  /**
   * Process appointment payment
   * Creates payment intent and records payment
   */
  async processAppointmentPayment(
    appointmentId: string,
    appointmentPrice: number,
    doctorId: string,
    paymentIntentId?: string | null
  ) {
    try {
      // Calculate commission
      const commissionPercentage = await commissionService.getCommissionPercentage();
      const { commissionAmount, doctorPayoutAmount, commissionPercentageUsed } =
        commissionService.calculateCommission(appointmentPrice, commissionPercentage);

      // Create payment record
      const payment = await prisma.appointmentPayment.create({
        data: {
          appointmentId,
          doctorId,
          appointmentPrice,
          commissionAmount,
          commissionPercentage: commissionPercentageUsed,
          doctorPayoutAmount,
          stripePaymentIntentId: paymentIntentId || null,
          status: "PROCESSING",
        },
      });

      return payment;
    } catch (error) {
      console.error("Error processing appointment payment:", error);
      throw new Error("Failed to process payment");
    }
  }

  /**
   * Confirm payment after Stripe webhook
   */
  async confirmPayment(
    paymentIntentId: string,
    chargeId: string,
    appointmentId?: string
  ) {
    try {
      const existingPayment = appointmentId
        ? await prisma.appointmentPayment.findUnique({
            where: { appointmentId },
          })
        : await prisma.appointmentPayment.findUnique({
            where: { stripePaymentIntentId: paymentIntentId },
          });

      if (!existingPayment) {
        throw new Error(
          `Payment record not found for payment intent ${paymentIntentId}${
            appointmentId ? ` / appointment ${appointmentId}` : ""
          }`
        );
      }

      const payment = await prisma.appointmentPayment.update({
        where: { id: existingPayment.id },
        data: {
          stripePaymentIntentId: paymentIntentId,
          patientPaid: true,
          patientPaidAt: new Date(),
          stripeChargeId: chargeId,
          status: "COMPLETED",
        },
        include: {
          appointment: true,
          doctor: true,
        },
      });

      return payment;
    } catch (error) {
      console.error("Error confirming payment:", error);
      throw new Error("Failed to confirm payment");
    }
  }

  /**
   * Mark payment as failed
   */
  async markPaymentFailed(paymentIntentId: string, appointmentId?: string) {
    try {
      const existingPayment = appointmentId
        ? await prisma.appointmentPayment.findUnique({
            where: { appointmentId },
          })
        : await prisma.appointmentPayment.findUnique({
            where: { stripePaymentIntentId: paymentIntentId },
          });

      if (!existingPayment) {
        throw new Error(
          `Payment record not found for payment intent ${paymentIntentId}${
            appointmentId ? ` / appointment ${appointmentId}` : ""
          }`
        );
      }

      const payment = await prisma.appointmentPayment.update({
        where: { id: existingPayment.id },
        data: {
          stripePaymentIntentId: paymentIntentId,
          status: "FAILED",
        },
      });

      return payment;
    } catch (error) {
      console.error("Error marking payment as failed:", error);
      throw new Error("Failed to mark payment as failed");
    }
  }

  /**
   * Hold doctor payout (escrow)
   * Schedule payout for after appointment
   */
  async holdDoctorPayout(paymentId: string, appointmentDate: Date) {
    try {
      // Schedule payout 2 hours after appointment time
      const payoutTime = new Date(appointmentDate);
      payoutTime.setHours(payoutTime.getHours() + 2);

      const payment = await prisma.appointmentPayment.update({
        where: { id: paymentId },
        data: {
          payoutScheduledAt: payoutTime,
        },
      });

      return payment;
    } catch (error) {
      console.error("Error holding doctor payout:", error);
      throw new Error("Failed to hold doctor payout");
    }
  }

  /**
   * Get payment by appointment ID
   */
  async getPaymentByAppointmentId(appointmentId: string) {
    try {
      const payment = await prisma.appointmentPayment.findUnique({
        where: { appointmentId },
        include: {
          appointment: true,
          doctor: true,
        },
      });

      return payment;
    } catch (error) {
      console.error("Error getting payment:", error);
      return null;
    }
  }

  /**
   * Get payment by payment intent ID
   */
  async getPaymentByIntentId(paymentIntentId: string) {
    try {
      const payment = await prisma.appointmentPayment.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
        include: {
          appointment: true,
          doctor: true,
        },
      });

      return payment;
    } catch (error) {
      console.error("Error getting payment:", error);
      return null;
    }
  }

  /**
   * Create Stripe Payment Link for an appointment
   * Returns the payment link URL
   */
  async createPaymentLink(
    appointmentId: string,
    amount: number,
    metadata: Record<string, string>
  ): Promise<string> {
    try {
      const paymentLink = await stripe.paymentLinks.create({
        payment_intent_data: {
          metadata: {
            ...metadata,
            appointmentId,
          },
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Appointment with ${metadata.doctorName || "Doctor"}`,
                description: `Appointment on ${metadata.date || ""} at ${metadata.time || ""}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        after_completion: {
          type: "redirect",
          redirect: {
            url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/appointments/${appointmentId}`,
          },
        },
      });

      return paymentLink.url;
    } catch (error) {
      console.error("Error creating payment link:", error);
      throw new Error("Failed to create payment link");
    }
  }
}

export const paymentService = new PaymentService();

