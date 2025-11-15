import AppointmentConfirmationEmail from "@/components/emails/AppointmentConfirmationEmail";
import transporter from "@/lib/nodemailer";
import { render } from "@react-email/render";
import type nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      userEmail,
      doctorName,
      appointmentDate,
      appointmentTime,
      appointmentType,
      duration,
      price,
    } = body;

    // validate required fields
    if (!userEmail || !doctorName || !appointmentDate || !appointmentTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Render React email component to HTML
    const emailHtml: string = await render(
      AppointmentConfirmationEmail({
        doctorName,
        appointmentDate,
        appointmentTime,
        appointmentType,
        duration,
        price,
      })
    );

    // Send the email using nodemailer
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.SMTP_FROM || `Medibook <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: "Appointment Confirmation - Medibook",
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "Email sent successfully", messageId: info.messageId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
