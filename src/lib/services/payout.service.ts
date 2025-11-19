import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { paymentService } from "./payment.service";

/**
 * Payout Service
 * Handles doctor payouts via Stripe Connect
 */
export class PayoutService {
  /**
   * Create payout to doctor's Stripe Connect account
   * Accounts for refunds - if commission was refunded, doctor gets more
   */
  async createPayout(paymentId: string) {
    try {
      const payment = await prisma.appointmentPayment.findUnique({
        where: { id: paymentId },
        include: {
          doctor: {
            include: { paymentAccount: true },
          },
          appointment: true,
        },
      });

      if (!payment) {
        throw new Error("Payment not found");
      }

      if (payment.doctorPaid) {
        throw new Error("Doctor already paid");
      }

      if (!payment.patientPaid) {
        throw new Error("Patient payment not confirmed");
      }

      // Don't process payout if appointment is cancelled and fully refunded
      if (payment.appointment && payment.appointment.status === "CANCELLED") {
        const isFullyRefunded = payment.status === "REFUNDED" && 
                                Number(payment.refundAmount || 0) >= Number(payment.appointmentPrice);
        if (isFullyRefunded) {
          throw new Error("Cannot payout: Appointment cancelled and fully refunded");
        }
      }

      if (!payment.doctor.paymentAccount) {
        throw new Error("Doctor payment account not set up");
      }

      if (payment.doctor.paymentAccount.accountStatus !== "ACTIVE") {
        throw new Error("Doctor payment account not active");
      }

      // Calculate final payout amount
      // If refunded, doctorPayoutAmount already includes commission refund adjustment
      // If not refunded, use original doctorPayoutAmount
      const payoutAmount = Number(payment.doctorPayoutAmount);

      if (payoutAmount <= 0) {
        throw new Error("Payout amount must be greater than zero");
      }

      // Create transfer to doctor's Stripe Connect account
      const transfer = await stripe.transfers.create({
        amount: Math.round(payoutAmount * 100), // Convert to cents
        currency: "usd",
        destination: payment.doctor.paymentAccount.stripeAccountId,
        metadata: {
          paymentId: payment.id,
          appointmentId: payment.appointmentId,
          doctorId: payment.doctorId,
          refunded: payment.refunded ? "true" : "false",
          originalCommission: payment.commissionAmount.toString(),
        },
      });

      // Update payment record
      await prisma.appointmentPayment.update({
        where: { id: paymentId },
        data: {
          doctorPaid: true,
          doctorPaidAt: new Date(),
          stripeTransferId: transfer.id,
        },
      });

      return transfer;
    } catch (error) {
      console.error("Error creating payout:", error);
      throw new Error("Failed to create payout");
    }
  }

  /**
   * Schedule payout for after appointment
   */
  async schedulePayout(paymentId: string, appointmentDate: Date) {
    try {
      const payoutTime = new Date(appointmentDate);
      payoutTime.setHours(payoutTime.getHours() + 2); // 2 hours after appointment

      await prisma.appointmentPayment.update({
        where: { id: paymentId },
        data: {
          payoutScheduledAt: payoutTime,
        },
      });
    } catch (error) {
      console.error("Error scheduling payout:", error);
      throw new Error("Failed to schedule payout");
    }
  }

  /**
   * Confirm payout after Stripe webhook
   */
  async confirmPayout(transferId: string) {
    try {
      await prisma.appointmentPayment.update({
        where: { stripeTransferId: transferId },
        data: {
          doctorPaid: true,
          doctorPaidAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error confirming payout:", error);
      throw new Error("Failed to confirm payout");
    }
  }

  /**
   * Mark payout as reversed
   * When a transfer is reversed, we update the payment record to reflect the reversal
   * This typically happens due to disputes, chargebacks, or manual reversals
   */
  async markPayoutReversed(transferId: string) {
    try {
      // Find the payment record by transfer ID
      const payment = await prisma.appointmentPayment.findUnique({
        where: { stripeTransferId: transferId },
        include: {
          doctor: {
            select: { name: true, email: true },
          },
          appointment: {
            select: { id: true, date: true, time: true },
          },
        },
      });

      if (!payment) {
        console.error(`Payment record not found for failed transfer: ${transferId}`);
        return;
      }

      // Update doctorPaid to false since the transfer was reversed
      // The stripeTransferId remains so we can track which transfer was reversed
      await prisma.appointmentPayment.update({
        where: { id: payment.id },
        data: {
          doctorPaid: false,
          doctorPaidAt: null,
        },
      });

      console.error("Payout reversed for transfer", {
        transferId,
        paymentId: payment.id,
        appointmentId: payment.appointmentId,
        doctorId: payment.doctorId,
        doctorName: payment.doctor.name,
        payoutAmount: payment.doctorPayoutAmount.toString(),
        appointmentDate: payment.appointment?.date,
      });

      // Note: The transfer was reversed, so doctorPaid is set to false
      // Admin can manually retry the payout if needed
      // This typically happens due to disputes, chargebacks, or manual reversals
    } catch (error) {
      console.error("Error marking payout as failed:", error);
      throw error;
    }
  }

  /**
   * Handle refund after payout has been made
   * This is a complex scenario - for MVP, we log it and require manual intervention
   * Post-MVP: Implement automatic reversal via Stripe
   */
  async handleRefundAfterPayout(paymentId: string, commissionRefundAmount: number) {
    try {
      const payment = await prisma.appointmentPayment.findUnique({
        where: { id: paymentId },
        include: {
          doctor: {
            include: { paymentAccount: true },
          },
        },
      });

      if (!payment || !payment.doctorPaid) {
        return; // No payout to reverse
      }

      if (!payment.stripeTransferId) {
        console.warn(`Payment ${paymentId} marked as paid but no transfer ID found`);
        return;
      }

      // Log the situation - requires manual intervention for MVP
      console.warn(
        `Refund requested after payout for payment ${paymentId}. ` +
        `Transfer ID: ${payment.stripeTransferId}, ` +
        `Commission refund amount: $${commissionRefundAmount}. ` +
        `Manual reversal may be required.`
      );

      // TODO: Post-MVP - Implement automatic reversal
      // For now, this requires admin intervention to reverse the transfer
      // Stripe allows reversing transfers within a certain time window
    } catch (error) {
      console.error("Error handling refund after payout:", error);
    }
  }

  /**
   * Get pending payouts that are ready to be processed
   * Excludes fully refunded and cancelled appointments
   */
  async getPendingPayouts() {
    try {
      const now = new Date();
      const payouts = await prisma.appointmentPayment.findMany({
        where: {
          patientPaid: true,
          doctorPaid: false,
          payoutScheduledAt: {
            lte: now,
          },
          status: { in: ["COMPLETED", "PARTIALLY_REFUNDED"] }, // Include partially refunded
          // Exclude fully refunded payments
          OR: [
            { refunded: false },
            { 
              refunded: true,
              status: { not: "REFUNDED" } // Partially refunded is OK
            }
          ],
        },
        include: {
          doctor: {
            include: { paymentAccount: true },
          },
          appointment: {
            select: {
              id: true,
              status: true,
              date: true,
            },
          },
        },
      });

      // Filter out cancelled appointments that are fully refunded
      return payouts.filter(payout => {
        if (payout.appointment?.status === "CANCELLED" && payout.status === "REFUNDED") {
          return false;
        }
        return true;
      });
    } catch (error) {
      console.error("Error getting pending payouts:", error);
      return [];
    }
  }
}

export const payoutService = new PayoutService();

