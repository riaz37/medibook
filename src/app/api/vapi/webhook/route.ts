import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { vapiService } from "@/lib/services/vapi.service";
import { doctorsConfigService } from "@/lib/services/doctors-config.service";
import { createLogger } from "@/lib/logger";
import crypto from "crypto";

const logger = createLogger("vapi-webhook");

/**
 * POST /api/vapi/webhook
 * Vapi webhook handler for processing function calls from the voice assistant
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let body: any;

    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Verify webhook secret if configured
    const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("x-vapi-signature");
      const verificationResult = verifyVapiSignature(
        rawBody,
        signature,
        webhookSecret
      );

      if (!verificationResult.valid) {
        return NextResponse.json(
          { error: verificationResult.error },
          { status: 400 }
        );
      }
    }

    // Handle function-call events from Vapi
    if (body.type === "function-call") {
      const { functionCall, call } = body;
      const functionName = functionCall?.name;
      const parameters = functionCall?.parameters || {};

      // Extract call context (phone numbers)
      const callerPhone = call?.from;
      const calledPhone = call?.to;

      let result: any;

      switch (functionName) {
        case "get_doctors":
          result = await handleGetDoctors();
          break;

        case "get_available_slots":
          result = await handleGetAvailableSlots(parameters.doctorId, parameters.date);
          break;

        case "get_appointment_types":
          result = await handleGetAppointmentTypes(parameters.doctorId);
          break;

        case "book_appointment":
          result = await handleBookAppointment(
            parameters,
            callerPhone,
            calledPhone
          );
          break;

        default:
          return NextResponse.json(
            { error: `Unknown function: ${functionName}` },
            { status: 400 }
          );
      }

      // Return result to Vapi
      // Vapi expects a simple result string or object
      return NextResponse.json({ result });
    }

    // Handle other event types if needed
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Vapi webhook error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Webhook processing failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * Get list of available doctors
 */
async function handleGetDoctors() {
  try {
    const doctors = await prisma.doctor.findMany({
      where: {
        isVerified: true,
      },
      select: {
        id: true,
        name: true,
        speciality: true,
        email: true,
        phone: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      doctors: doctors.map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        speciality: doctor.speciality,
        phone: doctor.phone,
      })),
    };
  } catch (error) {
    logger.error("Error getting doctors", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error("Failed to fetch doctors");
  }
}

function verifyVapiSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): { valid: boolean; error?: string } {
  if (!signatureHeader) {
    return { valid: false, error: "Missing x-vapi-signature header" };
  }

  const signatureValue = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice(7)
    : signatureHeader;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const providedBuffer = Buffer.from(signatureValue, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return { valid: false, error: "Invalid webhook signature" };
  }

  return { valid: true };
}

/**
 * Get available time slots for a doctor on a specific date
 */
async function handleGetAvailableSlots(doctorId: string, date: string) {
  try {
    if (!doctorId || !date) {
      throw new Error("Doctor ID and date are required");
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("Date must be in YYYY-MM-DD format");
    }

    const slots = await doctorsConfigService.getAvailableTimeSlots(doctorId, date);

    return {
      slots,
      date,
      doctorId,
    };
  } catch (error) {
    logger.error("Error getting available slots", {
      error: error instanceof Error ? error.message : "Unknown error",
      doctorId,
      date,
    });
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch available slots"
    );
  }
}

/**
 * Get appointment types for a doctor
 */
async function handleGetAppointmentTypes(doctorId: string) {
  try {
    if (!doctorId) {
      throw new Error("Doctor ID is required");
    }

    const types = await doctorsConfigService.getAppointmentTypes(doctorId);

    return {
      appointmentTypes: types.map((type) => ({
        id: type.id,
        name: type.name,
        duration: type.duration,
        price: type.price ? Number(type.price) : null,
        description: type.description,
      })),
    };
  } catch (error) {
    logger.error("Error getting appointment types", {
      error: error instanceof Error ? error.message : "Unknown error",
      doctorId,
    });
    throw new Error("Failed to fetch appointment types");
  }
}

/**
 * Book an appointment
 */
async function handleBookAppointment(
  parameters: {
    doctorId: string;
    date: string;
    time: string;
    appointmentTypeId: string;
    email?: string;
    phoneNumber?: string;
    reason?: string;
  },
  callerPhone?: string,
  calledPhone?: string
) {
  try {
    const { doctorId, date, time, appointmentTypeId, email, phoneNumber, reason } =
      parameters;

    // Validate required fields
    if (!doctorId || !date || !time || !appointmentTypeId) {
      throw new Error("Missing required fields: doctorId, date, time, appointmentTypeId");
    }

    // Get or create user
    const userPhone = phoneNumber || callerPhone;
    const userEmail = email;

    if (!userEmail && !userPhone) {
      throw new Error("Email or phone number is required to book an appointment");
    }

    const user = await vapiService.getUserFromCallContext(userPhone, userEmail);

    if (!user) {
      throw new Error("Could not identify or create user account");
    }

    // Call the booking API endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const bookingResponse = await fetch(`${baseUrl}/api/vapi/appointments/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        doctorId,
        date,
        time,
        appointmentTypeId,
        email: userEmail || user.email,
        phoneNumber: userPhone || user.phone,
        reason,
      }),
    });

    if (!bookingResponse.ok) {
      const errorData = await bookingResponse.json();
      throw new Error(errorData.error || "Failed to book appointment");
    }

    const bookingResult = await bookingResponse.json();

    // Format response message for Vapi
    if (bookingResult.requiresPayment) {
      return `Great! I've booked your appointment with ${bookingResult.doctorName} on ${bookingResult.date} at ${bookingResult.time}. I've sent a secure payment link to ${bookingResult.email}. Please complete the payment within 30 minutes to confirm your appointment.`;
    } else {
      return `Perfect! Your appointment with ${bookingResult.doctorName} is confirmed for ${bookingResult.date} at ${bookingResult.time}. You'll receive a confirmation email shortly.`;
    }
  } catch (error) {
    logger.error("Error booking appointment via Vapi", {
      error: error instanceof Error ? error.message : "Unknown error",
      doctorId: parameters.doctorId,
      appointmentTypeId: parameters.appointmentTypeId,
    });
    throw new Error(
      error instanceof Error ? error.message : "Failed to book appointment"
    );
  }
}


