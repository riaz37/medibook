import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { appointmentsServerService } from "@/lib/services/server";
import { bookAppointmentSchema, appointmentQuerySchema } from "@/lib/validations";
import { validateRequest, validateQuery } from "@/lib/utils/validation";
import AppointmentConfirmationEmail from "@/components/emails/AppointmentConfirmationEmail";
import transporter from "@/lib/nodemailer";
import { render } from "@react-email/render";
import { format } from "date-fns";
import type nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

function transformAppointment(appointment: any) {
  return {
    ...appointment,
    patientName: `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim(),
    patientEmail: appointment.user.email || "",
    doctorName: appointment.doctor.name,
    doctorImageUrl: appointment.doctor.imageUrl || "",
    date: appointment.date.toISOString().split("T")[0],
  };
}

// GET /api/appointments - Get appointments (role-based)
export async function GET(request: NextRequest) {
  try {
    // Middleware ensures user is authenticated
    const { getAuthContext } = await import("@/lib/utils/auth-utils");
    const context = await getAuthContext();
    
    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryParams: Record<string, string | undefined> = {};
    if (searchParams.get("doctorId")) {
      queryParams.doctorId = searchParams.get("doctorId") || undefined;
    }
    if (searchParams.get("status")) {
      queryParams.status = searchParams.get("status") || undefined;
    }
    if (searchParams.get("date")) {
      queryParams.date = searchParams.get("date") || undefined;
    }

    const queryValidation = validateQuery(appointmentQuerySchema, queryParams);
    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const { doctorId } = queryValidation.data;
    let whereClause: any = {};

    // Filter based on role
    let appointments;
    if (context.role === "patient") {
      // Patients can only see their own appointments - need DB user ID
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: context.clerkUserId },
        select: { id: true },
      });
      if (dbUser) {
        appointments = await appointmentsServerService.getByUser(dbUser.id, {
          status: queryValidation.data.status as any,
          date: queryValidation.data.date,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            doctor: { select: { name: true, imageUrl: true } },
          },
        });
      } else {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    } else if (context.role === "doctor") {
      // Doctors can see their own appointments
      if (context.doctorId) {
        appointments = await appointmentsServerService.getByDoctor(context.doctorId, {
          status: queryValidation.data.status as any,
          date: queryValidation.data.date,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            doctor: { select: { name: true, imageUrl: true } },
          },
        });
      } else {
        return NextResponse.json(
          { error: "Doctor profile not found" },
          { status: 404 }
        );
      }
    } else if (context.role === "admin") {
      // Admins can see all appointments, optionally filtered by doctorId
      appointments = await appointmentsServerService.findMany({
        doctorId: doctorId,
        status: queryValidation.data.status as any,
        date: queryValidation.data.date,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          doctor: { select: { name: true, imageUrl: true } },
        },
      });
    } else {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const transformedAppointments = appointments.map(transformAppointment);

    return NextResponse.json(transformedAppointments);
  } catch (error) {
    console.log("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Book a new appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = validateRequest(bookAppointmentSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { doctorId, date, time, reason, userId, appointmentTypeId } = validation.data;

    // If userId is provided directly (e.g., from VAPI), use it; otherwise get from Clerk auth
    let user;
    if (userId) {
      const { usersServerService } = await import("@/lib/services/server");
      user = await usersServerService.findUnique(userId);
      if (!user) {
        return NextResponse.json(
          { error: "User not found. Please ensure your account is properly set up." },
          { status: 404 }
        );
      }
    } else {
      // Middleware ensures user is authenticated
      const { userId: clerkUserId } = await auth();
      const { usersServerService } = await import("@/lib/services/server");
      user = await usersServerService.findUniqueByClerkId(clerkUserId || "");
      if (!user) {
        return NextResponse.json(
          { error: "User not found. Please ensure your account is properly set up." },
          { status: 404 }
        );
      }
    }

    // Validation is already done by schema, but keep for clarity

    // Get appointment type to get duration
    let duration = 30; // Default duration
    if (appointmentTypeId) {
      // Note: After running prisma generate, use: prisma.doctorAppointmentType
      // For now, we'll use a workaround
      try {
        const appointmentType = await (prisma as any).doctorAppointmentType?.findUnique({
          where: { id: appointmentTypeId },
        });
        if (appointmentType && appointmentType.doctorId === doctorId) {
          duration = appointmentType.duration;
        }
      } catch (error) {
        // If model doesn't exist yet, use default
        console.log("Appointment type model not available yet, using default duration");
      }
    } else {
      // If no appointment type, get default from doctor's availability
      try {
        const availability = await (prisma as any).doctorAvailability?.findUnique({
          where: { doctorId },
        });
        if (availability) {
          duration = availability.slotDuration;
        }
      } catch (error) {
        // If model doesn't exist yet, use default
        console.log("Availability model not available yet, using default duration");
      }
    }

    const appointment = await appointmentsServerService.create({
      userId: user.id,
      doctorId,
      date: new Date(date),
      time,
      duration,
      reason: reason || "General consultation",
      status: "PENDING" as any,
      appointmentTypeId: appointmentTypeId || undefined,
    });

    // Get appointment type details
    let appointmentType = null;
    if (appointmentTypeId) {
      try {
        appointmentType = await (prisma as any).doctorAppointmentType?.findUnique({
          where: { id: appointmentTypeId },
        });
      } catch (error) {
        console.log("Could not fetch appointment type");
      }
    }

    // Check if payment is required
    const requiresPayment = appointmentType?.price && Number(appointmentType.price) > 0;

    // Only send confirmation email if payment is not required
    // If payment is required, email will be sent after payment is confirmed via webhook
    if (!requiresPayment) {
      try {
        // Fetch doctor name separately to ensure type safety
        const doctor = await prisma.doctor.findUnique({
          where: { id: doctorId },
          select: { name: true },
        });

        if (!doctor) {
          throw new Error("Doctor not found");
        }

        const appointmentDateFormatted = format(new Date(date), "EEEE, MMMM d, yyyy");
        const emailHtml = await render(
          AppointmentConfirmationEmail({
            doctorName: doctor.name,
            appointmentDate: appointmentDateFormatted,
            appointmentTime: time,
            appointmentType: appointmentType?.name || reason || "Appointment",
            duration: appointmentType?.duration ? `${appointmentType.duration} minutes` : `${duration} minutes`,
            price: appointmentType?.price ? `$${appointmentType.price.toString()}` : "N/A",
          })
        );

        const mailOptions: nodemailer.SendMailOptions = {
          from: process.env.SMTP_FROM || `Medibook <${process.env.SMTP_USER}>`,
          to: user.email || "",
          subject: "Appointment Confirmation - Medibook",
          html: emailHtml,
        };

        await transporter.sendMail(mailOptions);
        console.log("Confirmation email sent successfully");
      } catch (emailError) {
        // Log error but don't fail the booking - email can be retried later
        console.error("Failed to send confirmation email:", emailError);
      }
    }

    return NextResponse.json(transformAppointment(appointment));
  } catch (error) {
    console.error("Error booking appointment:", error);
    return NextResponse.json(
      { error: "Failed to book appointment. Please try again later." },
      { status: 500 }
    );
  }
}

