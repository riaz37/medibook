import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { paymentService } from "./payment.service";
import { RefundType, RefundStatus } from "@prisma/client";

/**
 * Refund Service
 * Handles refunds and cancellations
 */
export class RefundService {
  /**
   * Calculate refund amount based on cancellation timing
   */
  calculateRefundAmount(
    appointmentPrice: number,
    commissionAmount: number,
    appointmentDate: Date
  ): {
    patientRefund: number;
    commissionRefund: number;
    refundType: RefundType;
    hoursBefore: number;
  } {
    const now = new Date();
    const hoursBefore = Math.floor(
      (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    if (hoursBefore >= 24) {
      // Full refund: patient gets full amount, commission refunded to doctor
      return {
        patientRefund: appointmentPrice,
        commissionRefund: commissionAmount,
        refundType: "FULL",
        hoursBefore,
      };
    } else if (hoursBefore >= 1) {
      // 50% refund: patient gets 50%, commission partially refunded
      return {
        patientRefund: appointmentPrice * 0.5,
        commissionRefund: commissionAmount * 0.5,
        refundType: "PARTIAL",
        hoursBefore,
      };
    } else {
      // No refund: commission kept, no patient refund
      return {
        patientRefund: 0,
        commissionRefund: 0,
        refundType: "NO_REFUND",
        hoursBefore,
      };
    }
  }

  /**
   * Process patient refund
   */
  async processPatientRefund(
    paymentId: string,
    amount: number,
    reason: string
  ) {
    try {
      const payment = await prisma.appointmentPayment.findUnique({
        where: { id: paymentId },
      });

      if (!payment || !payment.stripeChargeId) {
        throw new Error("Payment or charge ID not found");
      }

      if (amount <= 0) {
        return null; // No refund needed
      }

      // Create refund via Stripe
      const refund = await stripe.refunds.create({
        charge: payment.stripeChargeId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: "requested_by_customer",
        metadata: {
          paymentId,
          reason,
        },
      });

      return refund;
    } catch (error) {
      console.error("Error processing patient refund:", error);
      throw new Error("Failed to process patient refund");
    }
  }

  /**
   * Handle full cancellation flow
   */
  async handleCancellation(
    appointmentId: string,
    reason: string
  ) {
    try {
      const payment = await paymentService.getPaymentByAppointmentId(appointmentId);

      if (!payment) {
        throw new Error("Payment not found");
      }

      if (payment.refunded) {
        throw new Error("Payment already refunded");
      }

      // Get appointment to calculate timing
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      // Calculate refund amounts
      const refundCalculation = this.calculateRefundAmount(
        Number(payment.appointmentPrice),
        Number(payment.commissionAmount),
        appointment.date
      );

      // Process patient refund if applicable
      let stripeRefundId: string | null = null;
      if (refundCalculation.patientRefund > 0) {
        const refund = await this.processPatientRefund(
          payment.id,
          refundCalculation.patientRefund,
          reason
        );
        if (refund) {
          stripeRefundId = refund.id;
        }
      }

      // Calculate adjusted payout amount (original payout plus commission refund)
      // In marketplace model: if commission is refunded, doctor gets more
      const adjustedPayoutAmount = Number(payment.doctorPayoutAmount) + refundCalculation.commissionRefund;

      // Check if payout has already been made
      const { payoutService } = await import("./payout.service");
      if (payment.doctorPaid && refundCalculation.commissionRefund > 0) {
        // Payout already made - need to handle reversal
        await payoutService.handleRefundAfterPayout(payment.id, refundCalculation.commissionRefund);
      }

      // Update payment record with refund information
      await prisma.appointmentPayment.update({
        where: { id: payment.id },
        data: {
          refunded: true,
          refundAmount: refundCalculation.patientRefund,
          refundReason: reason,
          refundedAt: new Date(),
          stripeRefundId,
          refundType: refundCalculation.refundType,
          status: refundCalculation.patientRefund === Number(payment.appointmentPrice) 
            ? "REFUNDED" 
            : "PARTIALLY_REFUNDED",
          // Update doctor payout amount to reflect commission refund
          // If payout already made, this adjustment is for record-keeping
          doctorPayoutAmount: adjustedPayoutAmount,
        },
      });

      // Create refund record
      await prisma.paymentRefund.create({
        data: {
          paymentId: payment.id,
          amount: refundCalculation.patientRefund,
          refundType: refundCalculation.refundType,
          reason,
          hoursBeforeAppointment: refundCalculation.hoursBefore,
          stripeRefundId,
          status: stripeRefundId ? "COMPLETED" : "PENDING",
        },
      });

      return {
        patientRefund: refundCalculation.patientRefund,
        commissionRefund: refundCalculation.commissionRefund,
        refundType: refundCalculation.refundType,
      };
    } catch (error) {
      console.error("Error handling cancellation:", error);
      throw new Error("Failed to handle cancellation");
    }
  }

  /**
   * Update refund status from webhook
   */
  async updateRefundStatus(refundId: string, status: RefundStatus) {
    try {
      await prisma.paymentRefund.update({
        where: { stripeRefundId: refundId },
        data: { status },
      });
    } catch (error) {
      console.error("Error updating refund status:", error);
    }
  }
}

export const refundService = new RefundService();

