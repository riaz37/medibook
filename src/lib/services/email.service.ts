import { prisma } from "@/lib/prisma";
import AppointmentConfirmationEmail from "@/components/emails/AppointmentConfirmationEmail";
import transporter from "@/lib/nodemailer";
import { render } from "@react-email/render";
import { format } from "date-fns";
import type nodemailer from "nodemailer";

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

      const mailOptions: nodemailer.SendMailOptions = {
        from: process.env.SMTP_FROM || `Medibook <${process.env.SMTP_USER}>`,
        to: appointment.user.email || "",
        subject: "Appointment Confirmation - Medibook",
        html: emailHtml,
      };

      await transporter.sendMail(mailOptions);
      console.log("Confirmation email sent successfully for appointment:", appointmentId);
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
      throw error;
    }
  }
}

export const emailService = new EmailService();

