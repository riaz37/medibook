/**
 * Prescriptions Server Service
 * Handles all server-side prescription database operations and business logic.
 * 
 * This is server-only and should never be imported in client components.
 * 
 * Note: This file does not use "use server" because it exports classes, interfaces,
 * and instances, not Server Actions. Server Actions can only export async functions.
 * This service is used in API routes and server components, not as a Server Action.
 */

import { BaseServerService, ServerServiceError } from "./base-server.service";
import type { Prisma, Prescription, PrescriptionStatus } from "@/generated/prisma/client";

export interface FindPrescriptionsOptions {
  doctorId?: string;
  patientId?: string;
  status?: PrescriptionStatus;
  appointmentId?: string;
  limit?: number;
  offset?: number;
  include?: Prisma.PrescriptionInclude;
}

export interface CreatePrescriptionData {
  appointmentId?: string | null;
  doctorId: string;
  patientId: string;
  status?: PrescriptionStatus;
  expiryDate?: Date | string | null;
  notes?: string | null;
  changedBy?: string; // User ID who created the prescription
  items: Array<{
    medicationId?: string | null;
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string | null;
    quantity?: number | null;
    refillsAllowed: number;
  }>;
}

export interface UpdatePrescriptionData {
  status?: PrescriptionStatus;
  expiryDate?: Date | string | null;
  notes?: string | null;
}

class PrescriptionsServerService extends BaseServerService {
  /**
   * Find multiple prescriptions with filters
   */
  async findMany(options: FindPrescriptionsOptions = {}): Promise<Prescription[]> {
    return this.execute(async () => {
      const where: Prisma.PrescriptionWhereInput = {};

      if (options.doctorId) {
        where.doctorId = options.doctorId;
      }

      if (options.patientId) {
        where.patientId = options.patientId;
      }

      if (options.status) {
        where.status = options.status;
      }

      if (options.appointmentId) {
        where.appointmentId = options.appointmentId;
      }

      const defaultInclude: Prisma.PrescriptionInclude = {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            date: true,
            time: true,
          },
        },
        items: {
          include: {
            medication: true,
            refills: {
              where: { status: "PENDING" },
              take: 1,
            },
          },
        },
      };

      return await this.prisma.prescription.findMany({
        where,
        include: options.include || defaultInclude,
        orderBy: { createdAt: "desc" },
        take: options.limit,
        skip: options.offset,
      });
    }, "Failed to find prescriptions");
  }

  /**
   * Count prescriptions with filters
   */
  async count(options: Omit<FindPrescriptionsOptions, "include" | "limit" | "offset"> = {}): Promise<number> {
    return this.execute(async () => {
      const where: Prisma.PrescriptionWhereInput = {};

      if (options.doctorId) {
        where.doctorId = options.doctorId;
      }

      if (options.patientId) {
        where.patientId = options.patientId;
      }

      if (options.status) {
        where.status = options.status;
      }

      if (options.appointmentId) {
        where.appointmentId = options.appointmentId;
      }

      return await this.prisma.prescription.count({ where });
    }, "Failed to count prescriptions");
  }

  /**
   * Find prescription by ID
   */
  async findUnique(
    id: string,
    include?: Prisma.PrescriptionInclude
  ): Promise<Prescription | null> {
    this.validateRequired({ id }, ["id"]);

    return this.execute(async () => {
      const defaultInclude: Prisma.PrescriptionInclude = {
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
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        appointment: {
          select: {
            id: true,
            date: true,
            time: true,
            reason: true,
            status: true,
          },
        },
        items: {
          include: {
            medication: true,
            refills: {
              orderBy: { requestedAt: "desc" },
            },
          },
        },
        audits: {
          orderBy: { timestamp: "desc" },
          take: 10,
        },
      };

      return await this.prisma.prescription.findUnique({
        where: { id },
        include: include || defaultInclude,
      });
    }, "Failed to find prescription");
  }

  /**
   * Create a new prescription with validation
   */
  async create(data: CreatePrescriptionData): Promise<Prescription> {
    this.validateRequired(data, ["doctorId", "patientId"]);
    
    if (!data.items || data.items.length === 0) {
      throw new ServerServiceError(
        "Prescription must have at least one item",
        400,
        "VALIDATION_ERROR"
      );
    }

    return this.execute(async () => {
      // Validate prescription data
      const validation = await this.validatePrescriptionData({
        appointmentId: data.appointmentId || null,
        patientId: data.patientId,
        doctorId: data.doctorId,
      });

      if (!validation.valid) {
        throw new ServerServiceError(
          validation.error,
          validation.status,
          "VALIDATION_ERROR"
        );
      }

      // Create prescription with items
      const prescription = await this.prisma.prescription.create({
        data: {
          appointmentId: data.appointmentId || null,
          doctorId: data.doctorId,
          patientId: data.patientId,
          status: data.status || "ACTIVE",
          expiryDate: data.expiryDate
            ? typeof data.expiryDate === "string"
              ? new Date(data.expiryDate)
              : data.expiryDate
            : null,
          notes: data.notes || null,
          items: {
            create: data.items.map((item) => ({
              medicationId: item.medicationId || null,
              medicationName: item.medicationName,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions || null,
              quantity: item.quantity || null,
              refillsAllowed: item.refillsAllowed,
              refillsRemaining: item.refillsAllowed,
            })),
          },
        },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
              speciality: true,
              imageUrl: true,
            },
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          appointment: {
            select: {
              id: true,
              date: true,
              time: true,
              reason: true,
            },
          },
          items: {
            include: {
              medication: true,
            },
          },
        },
      });

      // Create audit log
      await this.createAudit(
        prescription.id,
        "CREATED",
        data.changedBy || data.doctorId, // Use changedBy if provided, otherwise doctorId
        {
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          itemCount: data.items.length,
        }
      );

      return prescription;
    }, "Failed to create prescription");
  }

  /**
   * Update prescription
   */
  async update(
    id: string,
    data: UpdatePrescriptionData,
    changedBy: string
  ): Promise<Prescription> {
    this.validateRequired({ id }, ["id"]);

    return this.execute(async () => {
      const existing = await this.findUnique(id);
      if (!existing) {
        throw new ServerServiceError("Prescription not found", 404, "NOT_FOUND");
      }

      const updateData: Prisma.PrescriptionUpdateInput = {};

      if (data.status !== undefined) {
        updateData.status = data.status;
      }

      if (data.expiryDate !== undefined) {
        updateData.expiryDate = data.expiryDate
          ? typeof data.expiryDate === "string"
            ? new Date(data.expiryDate)
            : data.expiryDate
          : null;
      }

      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }

      const updated = await this.prisma.prescription.update({
        where: { id },
        data: updateData,
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
              speciality: true,
              imageUrl: true,
            },
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          appointment: {
            select: {
              id: true,
              date: true,
              time: true,
              reason: true,
            },
          },
          items: {
            include: {
              medication: true,
              refills: {
                orderBy: { requestedAt: "desc" },
              },
            },
          },
        },
      });

      // Update status with business logic if needed
      if (data.status) {
        await this.updateStatusWithBusinessLogic(id, data.status);
      }

      // Create audit log
      const changes: Record<string, unknown> = {};
      if (data.status !== undefined) changes.status = data.status;
      if (data.expiryDate !== undefined) changes.expiryDate = data.expiryDate;
      if (data.notes !== undefined) changes.notes = data.notes;

      await this.createAudit(
        id,
        "UPDATED",
        changedBy,
        Object.keys(changes).length > 0 ? changes : undefined
      );

      return updated;
    }, "Failed to update prescription");
  }

  /**
   * Get prescriptions by doctor ID
   */
  async getByDoctor(
    doctorId: string,
    options: Omit<FindPrescriptionsOptions, "doctorId"> = {}
  ): Promise<{ prescriptions: Prescription[]; total: number }> {
    const prescriptions = await this.findMany({ ...options, doctorId });
    const total = await this.count({ ...options, doctorId });
    return { prescriptions, total };
  }

  /**
   * Get prescriptions by patient ID
   */
  async getByPatient(
    patientId: string,
    options: Omit<FindPrescriptionsOptions, "patientId"> = {}
  ): Promise<{ prescriptions: Prescription[]; total: number }> {
    const prescriptions = await this.findMany({ ...options, patientId });
    const total = await this.count({ ...options, patientId });
    return { prescriptions, total };
  }

  /**
   * Validate prescription data - business logic validation
   */
  async validatePrescriptionData(data: {
    appointmentId?: string | null;
    patientId: string;
    doctorId: string;
  }): Promise<{ valid: true } | { valid: false; error: string; status: number }> {
    // Validate appointment exists and belongs to doctor/patient if provided
    if (data.appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({
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

      // Check if appointment is completed or confirmed
      if (appointment.status !== "CONFIRMED" && appointment.status !== "COMPLETED") {
        return {
          valid: false,
          error: "Can only create prescription for confirmed or completed appointments",
          status: 400,
        };
      }

      // Check if prescription already exists for this appointment
      const existingPrescription = await this.prisma.prescription.findUnique({
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
    const patient = await this.prisma.user.findUnique({
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
    const doctor = await this.prisma.doctor.findUnique({
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
  async checkMedicationAvailability(
    medicationId: string | null | undefined
  ): Promise<{ exists: true; medication: { id: string; name: string } } | { exists: false }> {
    if (!medicationId) {
      return { exists: false };
    }

    const medication = await this.prisma.medication.findUnique({
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
  async createAudit(
    prescriptionId: string,
    action: string,
    changedBy: string,
    changes?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.prisma.prescriptionAudit.create({
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
  async updateStatusWithBusinessLogic(
    prescriptionId: string,
    newStatus: PrescriptionStatus
  ): Promise<{ success: true } | { success: false; error: string }> {
    const prescription = await this.prisma.prescription.findUnique({
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
        (item) => item.refillsRemaining === 0
      );
      if (allItemsCompleted) {
        await this.prisma.prescription.update({
          where: { id: prescriptionId },
          data: { status: "COMPLETED" },
        });
        return { success: true };
      }
    }

    // Auto-update to EXPIRED if expiry date has passed
    if (prescription.expiryDate && new Date() > prescription.expiryDate) {
      await this.prisma.prescription.update({
        where: { id: prescriptionId },
        data: { status: "EXPIRED" },
      });
      return { success: true };
    }

    return { success: true };
  }
}

// Export singleton instance
export const prescriptionsServerService = new PrescriptionsServerService();

