import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";
import { bookAppointmentSchema, appointmentQuerySchema } from "@/lib/validations";
import { validateRequest, validateQuery } from "@/lib/utils/validation";

function transformAppointment(appointment: any) {
  return {
    ...appointment,
    patientName: `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim(),
    patientEmail: appointment.user.email,
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
    if (context.role === "patient") {
      // Patients can only see their own appointments - need DB user ID
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: context.clerkUserId },
        select: { id: true },
      });
      if (dbUser) {
        whereClause.userId = dbUser.id;
      } else {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    } else if (context.role === "doctor") {
      // Doctors can see their own appointments
      if (context.doctorId) {
        whereClause.doctorId = context.doctorId;
      } else {
        return NextResponse.json(
          { error: "Doctor profile not found" },
          { status: 404 }
        );
      }
    } else if (context.role === "admin") {
      // Admins can see all appointments, optionally filtered by doctorId
      if (doctorId) {
        whereClause.doctorId = doctorId;
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
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
      orderBy: { createdAt: "desc" },
    });

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
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json(
          { error: "User not found. Please ensure your account is properly set up." },
          { status: 404 }
        );
      }
    } else {
      // Middleware ensures user is authenticated
      const { userId: clerkUserId } = await auth();
      user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
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

    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        doctorId,
        date: new Date(date),
        time,
        duration,
        reason: reason || "General consultation",
        status: "PENDING" as any, // Changed from CONFIRMED to PENDING - Run `npx prisma generate` to fix type
        appointmentTypeId: (appointmentTypeId || null) as any, // Run `npx prisma generate` to fix type
      },
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

    return NextResponse.json(transformAppointment(appointment));
  } catch (error) {
    console.error("Error booking appointment:", error);
    return NextResponse.json(
      { error: "Failed to book appointment. Please try again later." },
      { status: 500 }
    );
  }
}

