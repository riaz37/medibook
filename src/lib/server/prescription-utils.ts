"use server";

/**
 * Server-only Prescription Utilities
 * Helper functions for prescription authorization, validation, and business logic
 */

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthContext, type AuthContext } from "./rbac";

/**
 * Require prescription access - checks if user (doctor or patient) can access prescription
 */
export async function requirePrescriptionAccess(
  prescriptionId: string
): Promise<{ context: AuthContext; prescriptionId: string } | { response: NextResponse }> {
  // Get auth context with DB user for ownership check
  const context = await getAuthContext(true);

  if (!context || !context.dbUser) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  // Admin can access any prescription
  if (context.role === "admin") {
    return { context, prescriptionId };
  }

  // Get prescription to check ownership
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    select: { doctorId: true, patientId: true },
  });

  if (!prescription) {
    return {
      response: NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      ),
    };
  }

  // Patient can access their own prescriptions
  if (context.role === "patient" && prescription.patientId === context.dbUser.id) {
    return { context, prescriptionId };
  }

  // Doctor can access prescriptions they created
  if (context.role === "doctor" && context.doctorId === prescription.doctorId) {
    return { context, prescriptionId };
  }

  return {
    response: NextResponse.json(
      { error: "Forbidden: You don't have access to this prescription" },
      { status: 403 }
    ),
  };
}

/**
 * Validate prescription data - business logic validation
 */
export async function validatePrescriptionData(data: {
  appointmentId?: string | null;
  patientId: string;
  doctorId: string;
}): Promise<{ valid: true } | { valid: false; error: string; status: number }> {
  // Validate appointment exists and belongs to doctor/patient if provided
  if (data.appointmentId) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      select: { doctorId: true, userId: true, status: true },
    });

    if (!appointment) {
      return {
        valid: false,
        error: "Appointment not found",
        status: 404,
      };
    }

    // Check if appointment belongs to the doctor
    if (appointment.doctorId !== data.doctorId) {
      return {
        valid: false,
        error: "Appointment does not belong to this doctor",
        status: 403,
      };
    }

    // Check if appointment belongs to the patient
    if (appointment.userId !== data.patientId) {
      return {
        valid: false,
        error: "Appointment does not belong to this patient",
        status: 403,
      };
    }

    // Check if appointment is completed or confirmed (can't prescribe for cancelled/pending)
    if (appointment.status !== "CONFIRMED" && appointment.status !== "COMPLETED") {
      return {
        valid: false,
        error: "Can only create prescription for confirmed or completed appointments",
        status: 400,
      };
    }

    // Check if prescription already exists for this appointment
    const existingPrescription = await prisma.prescription.findUnique({
      where: { appointmentId: data.appointmentId },
      select: { id: true },
    });

    if (existingPrescription) {
      return {
        valid: false,
        error: "Prescription already exists for this appointment",
        status: 409,
      };
    }
  }

  // Validate patient exists
  const patient = await prisma.user.findUnique({
    where: { id: data.patientId },
    select: { id: true },
  });

  if (!patient) {
    return {
      valid: false,
      error: "Patient not found",
      status: 404,
    };
  }

  // Validate doctor exists
  const doctor = await prisma.doctor.findUnique({
    where: { id: data.doctorId },
    select: { id: true },
  });

  if (!doctor) {
    return {
      valid: false,
      error: "Doctor not found",
      status: 404,
    };
  }

  return { valid: true };
}

/**
 * Check if medication exists in database
 */
export async function checkMedicationAvailability(
  medicationId: string | null | undefined
): Promise<{ exists: true; medication: { id: string; name: string } } | { exists: false }> {
  if (!medicationId) {
    return { exists: false };
  }

  const medication = await prisma.medication.findUnique({
    where: { id: medicationId },
    select: { id: true, name: true, isActive: true },
  });

  if (!medication || !medication.isActive) {
    return { exists: false };
  }

  return { exists: true, medication };
}

/**
 * Create prescription audit log entry
 */
export async function createPrescriptionAudit(
  prescriptionId: string,
  action: string,
  changedBy: string,
  changes?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.prescriptionAudit.create({
      data: {
        prescriptionId,
        action,
        changedBy,
        changes: changes ? JSON.stringify(changes) : null,
      },
    });
  } catch (error) {
    // Log error but don't fail the operation
    console.error("Failed to create prescription audit:", error);
  }
}

/**
 * Update prescription status based on business rules
 */
export async function updatePrescriptionStatus(
  prescriptionId: string,
  newStatus: "ACTIVE" | "EXPIRED" | "CANCELLED" | "COMPLETED"
): Promise<{ success: true } | { success: false; error: string }> {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      items: {
        include: {
          refills: {
            where: { status: "PENDING" },
          },
        },
      },
    },
  });

  if (!prescription) {
    return { success: false, error: "Prescription not found" };
  }

  // Auto-update to COMPLETED if all items have no refills remaining
  if (newStatus === "ACTIVE") {
    const allItemsCompleted = prescription.items.every(
      (item: { refillsRemaining: number }) => item.refillsRemaining === 0
    );
    if (allItemsCompleted) {
      await prisma.prescription.update({
        where: { id: prescriptionId },
        data: { status: "COMPLETED" },
      });
      return { success: true };
    }
  }

  // Auto-update to EXPIRED if expiry date has passed
  if (prescription.expiryDate && new Date() > prescription.expiryDate) {
    await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { status: "EXPIRED" },
    });
    return { success: true };
  }

  return { success: true };
}

