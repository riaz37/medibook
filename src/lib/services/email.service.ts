import prisma from "@/lib/prisma";
import AppointmentConfirmationEmail from "@/components/emails/AppointmentConfirmationEmail";
import PaymentLinkEmail from "@/components/emails/PaymentLinkEmail";
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
}

export const emailService = new EmailService();

