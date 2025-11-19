import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { commissionService } from "./commission.service";
import { PaymentStatus, RefundType } from "@prisma/client";

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
    paymentIntentId: string
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
          stripePaymentIntentId: paymentIntentId,
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
  async confirmPayment(paymentIntentId: string, chargeId: string) {
    try {
      const payment = await prisma.appointmentPayment.update({
        where: { stripePaymentIntentId: paymentIntentId },
        data: {
          patientPaid: true,
          patientPaidAt: new Date(),
          stripeChargeId: chargeId,
          status: "COMPLETED",
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
  async markPaymentFailed(paymentIntentId: string) {
    try {
      const payment = await prisma.appointmentPayment.update({
        where: { stripePaymentIntentId: paymentIntentId },
        data: {
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
}

export const paymentService = new PaymentService();

