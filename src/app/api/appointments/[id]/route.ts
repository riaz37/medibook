import { NextRequest, NextResponse } from "next/server";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { updateAppointmentStatusSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";
import { requireAppointmentAccess } from "@/lib/server/auth-utils";

// GET /api/appointments/[id] - Get appointment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // Check appointment access (handles authorization)
    const accessResult = await requireAppointmentAccess(id);
    if ("response" in accessResult) {
      return accessResult.response;
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            speciality: true,
            imageUrl: true,
            bio: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        payment: {
          select: {
            id: true,
            appointmentPrice: true,
            commissionAmount: true,
            doctorPayoutAmount: true,
            status: true,
            patientPaid: true,
            doctorPaid: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Fetch appointment type separately if appointmentTypeId exists
    let appointmentType = null;
    if (appointment.appointmentTypeId) {
      appointmentType = await prisma.doctorAppointmentType.findUnique({
        where: { id: appointment.appointmentTypeId },
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
          description: true,
        },
      });
    }

    // Combine appointment with appointment type
    return NextResponse.json({
      ...appointment,
      appointmentType,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update appointment status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // Check appointment access (handles authorization)
    const accessResult = await requireAppointmentAccess(id);
    if ("response" in accessResult) {
      return accessResult.response;
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(updateAppointmentStatusSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { status } = validation.data;

    // Get current appointment to check previous status
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        payment: true,
      },
    });

    if (!currentAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // If status changed to CONFIRMED, validate payment and payout readiness
    if (
      status === "CONFIRMED" &&
      currentAppointment.status !== "CONFIRMED"
    ) {
      // If appointment has a payment record, ensure it's been processed
      if (currentAppointment.payment) {
        if (!currentAppointment.payment.patientPaid) {
          return NextResponse.json(
            { 
              error: "Cannot confirm appointment: Patient payment not yet processed. Please wait for payment confirmation." 
            },
            { status: 400 }
          );
        }
        
        if (currentAppointment.payment.status !== "COMPLETED") {
          return NextResponse.json(
            { 
              error: `Cannot confirm appointment: Payment status is ${currentAppointment.payment.status}. Payment must be completed.` 
            },
            { status: 400 }
          );
        }
      }
      
      // Log successful confirmation with commission info
      if (currentAppointment.payment) {
        console.log(
          `Appointment ${id} confirmed. Commission: $${currentAppointment.payment.commissionAmount}, Doctor payout: $${currentAppointment.payment.doctorPayoutAmount}`
        );
      }

      // Ensure doctor payout account is active before confirming
      const doctorPaymentAccount = await prisma.doctorPaymentAccount.findUnique({
        where: { doctorId: currentAppointment.doctorId },
        select: {
          accountStatus: true,
          payoutEnabled: true,
        },
      });

      if (!doctorPaymentAccount) {
        return NextResponse.json(
          {
            error:
              "Cannot confirm appointment: Doctor payout account is not set up. Please complete Stripe onboarding.",
          },
          { status: 400 }
        );
      }

      if (
        doctorPaymentAccount.accountStatus !== "ACTIVE" ||
        doctorPaymentAccount.payoutEnabled === false
      ) {
        return NextResponse.json(
          {
            error:
              "Cannot confirm appointment: Doctor payout account is not active. Please finish Stripe onboarding.",
          },
          { status: 400 }
        );
      }
    }

    // Update appointment status after validations pass
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: status as AppointmentStatus },
      include: {
        payment: {
          select: {
            id: true,
            appointmentPrice: true,
            commissionAmount: true,
            doctorPayoutAmount: true,
            status: true,
            patientPaid: true,
            doctorPaid: true,
          },
        },
      },
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

