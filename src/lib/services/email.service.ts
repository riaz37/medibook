import prisma from "@/lib/prisma";
import AppointmentConfirmationEmail from "@/components/emails/AppointmentConfirmationEmail";
import AppointmentCancellationEmail from "@/components/emails/AppointmentCancellationEmail";
import AppointmentRescheduleEmail from "@/components/emails/AppointmentRescheduleEmail";
import PaymentLinkEmail from "@/components/emails/PaymentLinkEmail";
import PasswordResetEmail from "@/components/emails/PasswordResetEmail";
import EmailVerificationEmail from "@/components/emails/EmailVerificationEmail";
import DoctorApplicationApprovalEmail from "@/components/emails/DoctorApplicationApprovalEmail";
import DoctorApplicationRejectionEmail from "@/components/emails/DoctorApplicationRejectionEmail";
import transporter from "@/lib/nodemailer";
import { pdfService } from "@/lib/services/pdf.service";
import { render } from "@react-email/render";
import { format } from "date-fns";
import type { Attachment } from "nodemailer/lib/mailer";
import type { SendMailOptions } from "nodemailer";

/**
 * Email Service
 * Handles sending appointment confirmation emails
 */
export class EmailService {
  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmation(appointmentId: string) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          doctor: {
            select: {
              name: true,
            },
          },
          payment: true,
        },
      });

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      // Get appointment type
      let appointmentType = null;
      if (appointment.appointmentTypeId) {
        appointmentType = await prisma.doctorAppointmentType.findUnique({
          where: { id: appointment.appointmentTypeId },
        });
      }

      const appointmentDateFormatted = format(appointment.date, "EEEE, MMMM d, yyyy");
      const emailHtml = await render(
        AppointmentConfirmationEmail({
          doctorName: appointment.doctor.name,
          appointmentDate: appointmentDateFormatted,
          appointmentTime: appointment.time,
          appointmentType: appointmentType?.name || appointment.reason || "Appointment",
          duration: appointmentType?.duration
            ? `${appointmentType.duration} minutes`
            : `${appointment.duration} minutes`,
          price: appointmentType?.price
            ? `$${appointmentType.price.toString()}`
            : appointment.payment
              ? `$${appointment.payment.appointmentPrice.toString()}`
              : "N/A",
        })
      );

      const attachments: Attachment[] = [];

      try {
        const appointmentPdf = await pdfService.generateAppointmentSummary(appointment.id);
        attachments.push({
          filename: appointmentPdf.filename,
          content: appointmentPdf.buffer,
          contentType: "application/pdf",
        });
      } catch (pdfError) {
        console.error("Failed to generate appointment PDF:", pdfError);
      }

      const mailOptions: SendMailOptions = {
        from: process.env.SMTP_FROM || `Medibook <${process.env.SMTP_USER}>`,
        to: appointment.user.email || "",
        subject: "Appointment Confirmation - Medibook",
        html: emailHtml,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      await transporter.sendMail(mailOptions);
      console.log("Confirmation email sent successfully for appointment:", appointmentId);
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
      throw error;
    }
  }

  /**
   * Send payment link email
   */
  async sendPaymentLinkEmail(
    appointmentId: string,
    paymentLink: string,
    recipientEmail: string
  ) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctor: {
            select: {
              name: true,
            },
          },
          payment: true,
        },
      });

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      // Get appointment type
      let appointmentType = null;
      if (appointment.appointmentTypeId) {
        appointmentType = await prisma.doctorAppointmentType.findUnique({
          where: { id: appointment.appointmentTypeId },
        });
      }

      const appointmentDateFormatted = format(appointment.date, "EEEE, MMMM d, yyyy");
      const price = appointment.payment
        ? `$${appointment.payment.appointmentPrice.toFixed(2)}`
        : appointmentType?.price
          ? `$${Number(appointmentType.price).toFixed(2)}`
          : "N/A";

      const emailHtml = await render(
        PaymentLinkEmail({
          doctorName: appointment.doctor.name,
          appointmentDate: appointmentDateFormatted,
          appointmentTime: appointment.time,
          appointmentType: appointmentType?.name || appointment.reason || "Appointment",
          duration: appointmentType?.duration
            ? `${appointmentType.duration} minutes`
            : `${appointment.duration} minutes`,
          price,
          paymentLink,
        })
      );

      const mailOptions: SendMailOptions = {
        from: process.env.SMTP_FROM || `Medibook <${process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: "Complete Your Payment - Medibook Appointment",
        html: emailHtml,
      };

      await transporter.sendMail(mailOptions);
      console.log("Payment link email sent successfully for appointment:", appointmentId);
    } catch (error) {
      console.error("Failed to send payment link email:", error);
      throw error;
    }
  }

  /**
   * Send appointment cancellation email
   */
  async sendAppointmentCancellation(appointmentId: string, reason?: string) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          user: { select: { email: true } },
          doctor: { select: { name: true } },
        },
      });

      if (!appointment || !appointment.user.email) return;

      const appointmentDateFormatted = format(appointment.date, "EEEE, MMMM d, yyyy");
      const emailHtml = await render(
        AppointmentCancellationEmail({
          doctorName: appointment.doctor.name,
          appointmentDate: appointmentDateFormatted,
          appointmentTime: appointment.time,
          reason,
        })
      );

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `Medibook <${process.env.SMTP_USER}>`,
        to: appointment.user.email,
        subject: "Appointment Cancelled - Medibook",
        html: emailHtml,
      });

      console.log("Cancellation email sent for:", appointmentId);
    } catch (error) {
      console.error("Failed to send cancellation email:", error);
      // Don't throw, just log
    }
  }

  /**
   * Send appointment reschedule email
   */
  async sendAppointmentReschedule(
    appointmentId: string,
    oldDate: Date,
    oldTime: string
  ) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          user: { select: { email: true } },
          doctor: { select: { name: true } },
        },
      });

      if (!appointment || !appointment.user.email) return;

      const appointmentDateFormatted = format(appointment.date, "EEEE, MMMM d, yyyy");
      const oldDateFormatted = format(oldDate, "EEEE, MMMM d, yyyy");

      const emailHtml = await render(
        AppointmentRescheduleEmail({
          doctorName: appointment.doctor.name,
          appointmentDate: appointmentDateFormatted,
          appointmentTime: appointment.time,
          oldDate: oldDateFormatted,
          oldTime: oldTime,
        })
      );

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `Medibook <${process.env.SMTP_USER}>`,
        to: appointment.user.email,
        subject: "Appointment Rescheduled - Medibook",
        html: emailHtml,
      });

      console.log("Reschedule email sent for:", appointmentId);
    } catch (error) {
      console.error("Failed to send reschedule email:", error);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetLink: string,
    userName?: string
  ) {
    try {
      const emailHtml = await render(
        PasswordResetEmail({
          resetLink,
          userName,
          expiresIn: "1 hour",
        })
      );

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `Medibook <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Reset Your Password - Medibook",
        html: emailHtml,
      });

      console.log("Password reset email sent to:", email);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      throw error;
    }
  }

  /**
   * Send email verification email
   */
  async sendEmailVerification(
    email: string,
    verificationLink: string,
    userName?: string,
    verificationCode?: string
  ) {
    try {
      const emailHtml = await render(
        EmailVerificationEmail({
          verificationLink,
          verificationCode,
          userName,
          expiresIn: "24 hours",
        })
      );

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `Medibook <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Verify Your Email - Medibook",
        html: emailHtml,
      });

      console.log("Verification email sent to:", email);
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw error;
    }
  }

  /**
   * Send doctor application approval email
   */
  async sendDoctorApplicationApproval(
    email: string,
    doctorName: string,
    speciality?: string
  ) {
    try {
      const emailHtml = await render(
        DoctorApplicationApprovalEmail({
          doctorName,
          speciality,
        })
      );

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `Medibook <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Doctor Application Approved - Welcome to Medibook!",
        html: emailHtml,
      });

      console.log("Doctor application approval email sent to:", email);
    } catch (error) {
      console.error("Failed to send doctor application approval email:", error);
      throw error;
    }
  }

  /**
   * Send doctor application rejection email
   */
  async sendDoctorApplicationRejection(
    email: string,
    doctorName: string,
    rejectionReason?: string
  ) {
    try {
      const emailHtml = await render(
        DoctorApplicationRejectionEmail({
          doctorName,
          rejectionReason,
        })
      );

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `Medibook <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Doctor Application Update - Medibook",
        html: emailHtml,
      });

      console.log("Doctor application rejection email sent to:", email);
    } catch (error) {
      console.error("Failed to send doctor application rejection email:", error);
      throw error;
    }
  }
}

export const emailService = new EmailService();

