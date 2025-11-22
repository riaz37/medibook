import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { paymentService } from "@/lib/services/payment.service";
import { emailService } from "@/lib/services/email.service";
import { format } from "date-fns";

/**
 * POST /api/vapi/appointments/book
 * Book an appointment from Vapi voice assistant
 * Creates appointment and sends payment link via email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      doctorId,
      date,
      time,
      appointmentTypeId,
      email,
      phoneNumber,
      reason,
    } = body;

    // Validate required fields
    if (!doctorId || !date || !time || !appointmentTypeId) {
      return NextResponse.json(
        { error: "Missing required fields: doctorId, date, time, appointmentTypeId" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify doctor exists and is verified
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
      },
    });

    if (!doctor || !doctor.isVerified) {
      return NextResponse.json(
        { error: "Doctor not found or not verified" },
        { status: 404 }
      );
    }

    // Get appointment type
    const appointmentType = await prisma.doctorAppointmentType.findUnique({
      where: { id: appointmentTypeId },
    });

    if (!appointmentType || appointmentType.doctorId !== doctorId) {
      return NextResponse.json(
        { error: "Appointment type not found or invalid" },
        { status: 404 }
      );
    }

    // Get duration from appointment type
    const duration = appointmentType.duration || 30;

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId,
        doctorId,
        date: new Date(date),
        time,
        duration,
        reason: reason || appointmentType.name || "General consultation",
        status: "PENDING",
        appointmentTypeId,
      },
      include: {
        doctor: {
          select: {
            name: true,
            email: true,
          },
        },
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Check if payment is required
    const appointmentPrice = appointmentType.price
      ? Number(appointmentType.price)
      : 0;
    const requiresPayment = appointmentPrice > 0;

    let paymentLink: string | null = null;

    if (requiresPayment) {
      // Create payment record
      await paymentService.processAppointmentPayment(
        appointment.id,
        appointmentPrice,
        doctorId,
        null
      );

      // Format date for payment link metadata
      const appointmentDateFormatted = format(new Date(date), "EEEE, MMMM d, yyyy");

      // Create Stripe Payment Link
      paymentLink = await paymentService.createPaymentLink(appointment.id, appointmentPrice, {
        appointmentId: appointment.id,
        doctorId,
        doctorName: doctor.name,
        date: appointmentDateFormatted,
        time,
      });

      // Send payment link email
      const userEmail = email || user.email;
      if (userEmail) {
        await emailService.sendPaymentLinkEmail(
          appointment.id,
          paymentLink,
          userEmail
        );
      }
    } else {
      // No payment required - send confirmation email directly
      await emailService.sendAppointmentConfirmation(appointment.id);
    }

    // Format date for response
    const appointmentDateFormatted = format(new Date(date), "EEEE, MMMM d, yyyy");

    return NextResponse.json({
      appointmentId: appointment.id,
      doctorName: doctor.name,
      date: appointmentDateFormatted,
      time,
      appointmentType: appointmentType.name,
      duration: `${duration} minutes`,
      price: appointmentPrice > 0 ? `$${appointmentPrice.toFixed(2)}` : "Free",
      requiresPayment,
      paymentLink,
      email: email || user.email,
      message: requiresPayment
        ? "Appointment booked. Payment link sent to your email."
        : "Appointment booked successfully.",
    });
  } catch (error) {
    console.error("Error booking appointment via Vapi:", error);
    return NextResponse.json(
      {
        error: "Failed to book appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

