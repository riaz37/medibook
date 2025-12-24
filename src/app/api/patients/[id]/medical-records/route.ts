import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireAnyRole } from "@/lib/server/rbac";
import { z } from "zod";

const createMedicalRecordSchema = z.object({
  recordType: z.enum([
    "CONSULTATION",
    "DIAGNOSIS",
    "TREATMENT",
    "LAB_RESULT",
    "IMAGING",
    "VACCINATION",
    "ALLERGY",
    "SURGERY",
    "CHRONIC_CONDITION",
    "MEDICATION",
    "GENERAL_NOTE",
  ]),
  title: z.string().min(1),
  description: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  appointmentId: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  recordDate: z.string().datetime().optional(),
});

// GET - Get patient's medical records
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    
    // Require auth and check role
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    const { context } = authResult;

    // Patients can only view their own records
    // Doctors can view records of their patients (from appointments)
    // Admins can view all records
    if (context.role === "patient" && context.userId !== patientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If doctor, verify they have treated this patient
    if (context.role === "doctor") {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: context.userId },
      });

      if (!doctor) {
        return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
      }

      const hasAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId: doctor.id,
          userId: patientId,
        },
      });

      if (!hasAppointment) {
        return NextResponse.json(
          { error: "You can only view medical records of your patients" },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const recordType = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = { patientId };
    if (recordType) {
      where.recordType = recordType;
    }

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        orderBy: { recordDate: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    return NextResponse.json({
      records,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching medical records:", error);
    return NextResponse.json(
      { error: "Failed to fetch medical records" },
      { status: 500 }
    );
  }
}

// POST - Create a medical record (doctors only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    
    // Require doctor or admin role
    const authResult = await requireAnyRole(["doctor", "admin"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { context } = authResult;

    const body = await req.json();
    const result = createMedicalRecordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.issues },
        { status: 400 }
      );
    }

    // Verify patient exists
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // If doctor, verify they have an appointment with this patient
    if (context.role === "doctor") {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: context.userId },
      });

      if (!doctor) {
        return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
      }

      const hasAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId: doctor.id,
          userId: patientId,
        },
      });

      if (!hasAppointment) {
        return NextResponse.json(
          { error: "You can only create records for your patients" },
          { status: 403 }
        );
      }
    }

    const data = result.data;

    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        recordType: data.recordType,
        title: data.title,
        description: data.description,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        notes: data.notes,
        appointmentId: data.appointmentId,
        attachments: data.attachments ? JSON.stringify(data.attachments) : null,
        recordDate: data.recordDate ? new Date(data.recordDate) : new Date(),
        createdBy: context.userId,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Error creating medical record:", error);
    return NextResponse.json(
      { error: "Failed to create medical record" },
      { status: 500 }
    );
  }
}
