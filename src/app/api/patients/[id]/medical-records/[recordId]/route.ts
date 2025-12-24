import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireAnyRole } from "@/lib/server/rbac";
import { z } from "zod";

const updateMedicalRecordSchema = z.object({
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
  ]).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  treatment: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  attachments: z.array(z.string()).optional().nullable(),
  recordDate: z.string().datetime().optional(),
});

// GET - Get a specific medical record
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { id: patientId, recordId } = await params;
    
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    const { context } = authResult;

    // Patients can only view their own records
    if (context.role === "patient" && context.userId !== patientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const record = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        patientId,
      },
    });

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
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
          { error: "You can only view records of your patients" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Error fetching medical record:", error);
    return NextResponse.json(
      { error: "Failed to fetch medical record" },
      { status: 500 }
    );
  }
}

// PUT - Update a medical record (doctors and admins only)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { id: patientId, recordId } = await params;
    
    const authResult = await requireAnyRole(["doctor", "admin"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { context } = authResult;

    const body = await req.json();
    const result = updateMedicalRecordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.issues },
        { status: 400 }
      );
    }

    // Find the record
    const existingRecord = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        patientId,
      },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // If doctor, verify they created this record or have treated this patient
    if (context.role === "doctor") {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: context.userId },
      });

      if (!doctor) {
        return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
      }

      // Check if doctor created this record or has an appointment with the patient
      if (existingRecord.createdBy !== context.userId) {
        const hasAppointment = await prisma.appointment.findFirst({
          where: {
            doctorId: doctor.id,
            userId: patientId,
          },
        });

        if (!hasAppointment) {
          return NextResponse.json(
            { error: "You can only update your own records or records of your patients" },
            { status: 403 }
          );
        }
      }
    }

    const data = result.data;
    const updateData: any = {
      updatedBy: context.userId,
    };

    if (data.recordType) updateData.recordType = data.recordType;
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis;
    if (data.treatment !== undefined) updateData.treatment = data.treatment;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.attachments !== undefined) {
      updateData.attachments = data.attachments ? JSON.stringify(data.attachments) : null;
    }
    if (data.recordDate) updateData.recordDate = new Date(data.recordDate);

    const record = await prisma.medicalRecord.update({
      where: { id: recordId },
      data: updateData,
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Error updating medical record:", error);
    return NextResponse.json(
      { error: "Failed to update medical record" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a medical record (admins only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { id: patientId, recordId } = await params;
    
    const authResult = await requireAnyRole(["admin"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const record = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        patientId,
      },
    });

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    await prisma.medicalRecord.delete({
      where: { id: recordId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting medical record:", error);
    return NextResponse.json(
      { error: "Failed to delete medical record" },
      { status: 500 }
    );
  }
}
