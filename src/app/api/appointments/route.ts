import { NextRequest, NextResponse } from "next/server";
import { appointmentsServerService, usersServerService } from "@/lib/services/server";
import { bookAppointmentSchema, appointmentQuerySchema } from "@/lib/validations";
import { validateRequest, validateQuery } from "@/lib/utils/validation";
import { requireAuth } from "@/lib/server/rbac";
import { createErrorResponse, createServerErrorResponse, createNotFoundResponse } from "@/lib/utils/api-response";
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
    doctorSpeciality: appointment.doctor.speciality || null,
    date: appointment.date.toISOString().split("T")[0],
    price: appointment.payment?.appointmentPrice ? Number(appointment.payment.appointmentPrice) : null,
    paymentStatus: appointment.payment?.status || null,
    patientPaid: appointment.payment?.patientPaid || false,
    refunded: appointment.payment?.refunded || false,
    hasPrescription: !!appointment.prescription,
    prescriptionId: appointment.prescription?.id || null,
    appointmentTypeName: null, // TODO: Fetch separately if needed using appointmentTypeId
  };
}

// GET /api/appointments - Get appointments (role-based)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;
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
      // Patients can only see their own appointments - use context.userId
      appointments = await appointmentsServerService.getByUser(context.userId, {
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
            doctor: { select: { name: true, imageUrl: true, speciality: true } },
            payment: {
              select: {
                id: true,
                appointmentPrice: true,
                status: true,
                patientPaid: true,
                refunded: true,
                refundAmount: true,
              },
            },
            prescription: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        });
    } else if (context.role === "doctor" || context.role === "doctor_pending") {
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
            doctor: { select: { name: true, imageUrl: true, speciality: true } },
            payment: {
              select: {
                id: true,
                appointmentPrice: true,
                status: true,
                patientPaid: true,
                refunded: true,
                refundAmount: true,
              },
            },
            prescription: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        });
      } else {
        return createNotFoundResponse("Doctor profile");
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
          doctor: { select: { name: true, imageUrl: true, speciality: true } },
          payment: {
            select: {
              id: true,
              appointmentPrice: true,
              status: true,
              patientPaid: true,
              refunded: true,
              refundAmount: true,
            },
          },
          prescription: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });
    } else {
      return createErrorResponse("Unauthorized", 401, undefined, "UNAUTHORIZED");
    }

    const transformedAppointments = appointments.map(transformAppointment);

    return NextResponse.json(transformedAppointments);
  } catch (error) {
    console.error("[GET /api/appointments] Error:", error);
    return createServerErrorResponse("Failed to fetch appointments");
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

    // If userId is provided directly (e.g., from VAPI), use it; otherwise get from auth
    let user;
    if (userId) {
      user = await usersServerService.findUnique(userId);
      if (!user) {
        return createNotFoundResponse("User");
      }
    } else {
      // Middleware ensures user is authenticated
      const authResult = await requireAuth();
      if ("response" in authResult) {
        return authResult.response;
      }
      const { context } = authResult;
      user = await usersServerService.findUnique(context.userId);
      if (!user) {
        return createNotFoundResponse("User");
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
        console.error("[POST /api/appointments] Appointment type model not available yet, using default duration");
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
        console.error("[POST /api/appointments] Availability model not available yet, using default duration");
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
        console.error("[POST /api/appointments] Could not fetch appointment type");
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
        console.log("[POST /api/appointments] Confirmation email sent successfully");
      } catch (emailError) {
        // Log error but don't fail the booking - email can be retried later
        console.error("[POST /api/appointments] Failed to send confirmation email:", emailError);
      }
    }

    return NextResponse.json(transformAppointment(appointment), { status: 201 });
  } catch (error) {
    console.error("[POST /api/appointments] Error:", error);
    return createServerErrorResponse("Failed to book appointment");
  }
}
