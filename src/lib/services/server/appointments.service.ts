/**
 * Appointments Server Service
 * Handles all server-side appointment database operations and business logic.
 * 
 * This is server-only and should never be imported in client components.
 * 
 * Note: This file does not use "use server" because it exports classes, interfaces,
 * and instances, not Server Actions. Server Actions can only export async functions.
 * This service is used in API routes and server components, not as a Server Action.
 */

import { BaseServerService, ServerServiceError } from "./base-server.service";
import type { Prisma, Appointment, AppointmentStatus } from "@/generated/prisma/client";
import { cacheService, CacheKeys, CacheTTL } from "./cache.service";
import { emailService } from "../email.service";

export interface FindAppointmentsOptions {
  doctorId?: string;
  userId?: string;
  status?: AppointmentStatus;
  date?: string;
  limit?: number;
  offset?: number;
  include?: Prisma.AppointmentInclude;
}

export interface CreateAppointmentData {
  userId: string;
  doctorId: string;
  date: Date | string;
  time: string;
  duration: number;
  reason?: string;
  notes?: string;
  appointmentTypeId?: string;
  status?: AppointmentStatus;
}

export interface UpdateAppointmentData {
  status?: AppointmentStatus;
  date?: Date | string;
  time?: string;
  duration?: number;
  reason?: string;
  notes?: string;
}

export interface RescheduleAppointmentData {
  date: string;
  time: string;
}

class AppointmentsServerService extends BaseServerService {
  /**
   * Find multiple appointments with filters
   */
  async findMany(options: FindAppointmentsOptions = {}): Promise<Appointment[]> {
    return this.execute(async () => {
      const where: Prisma.AppointmentWhereInput = {};

      if (options.doctorId) {
        where.doctorId = options.doctorId;
      }

      if (options.userId) {
        where.userId = options.userId;
      }

      if (options.status) {
        where.status = options.status;
      }

      if (options.date) {
        const date = new Date(options.date);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        where.date = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }

      return await this.prisma.appointment.findMany({
        where,
        include: options.include || {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          doctor: {
            select: {
              name: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: options.limit,
        skip: options.offset,
      });
    }, "Failed to find appointments");
  }

  /**
   * Count appointments with filters
   */
  async count(options: Omit<FindAppointmentsOptions, "include" | "limit" | "offset"> = {}): Promise<number> {
    return this.execute(async () => {
      const where: Prisma.AppointmentWhereInput = {};

      if (options.doctorId) {
        where.doctorId = options.doctorId;
      }

      if (options.userId) {
        where.userId = options.userId;
      }

      if (options.status) {
        where.status = options.status;
      }

      if (options.date) {
        const date = new Date(options.date);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        where.date = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }

      return await this.prisma.appointment.count({ where });
    }, "Failed to count appointments");
  }

  /**
   * Find appointment by ID
   */
  async findUnique(
    id: string,
    include?: Prisma.AppointmentInclude
  ): Promise<Appointment | null> {
    this.validateRequired({ id }, ["id"]);

    return this.execute(async () => {
      return await this.prisma.appointment.findUnique({
        where: { id },
        include: include || {
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
    }, "Failed to find appointment");
  }

  /**
   * Create a new appointment
   */
  async create(data: CreateAppointmentData): Promise<Appointment> {
    this.validateRequired(data, ["userId", "doctorId", "date", "time", "duration"]);

    return this.execute(async () => {
      const appointmentDate = typeof data.date === "string" ? new Date(data.date) : data.date;

      // Validate date is in the future
      if (appointmentDate < new Date()) {
        throw new ServerServiceError(
          "Appointment date must be in the future",
          400,
          "INVALID_DATE"
        );
      }

      // Validate time format
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(data.time)) {
        throw new ServerServiceError(
          "Time must be in HH:MM format (24-hour)",
          400,
          "INVALID_TIME_FORMAT"
        );
      }

      return await this.prisma.appointment.create({
        data: {
          userId: data.userId,
          doctorId: data.doctorId,
          date: appointmentDate,
          time: data.time,
          duration: data.duration,
          reason: data.reason || "General consultation",
          notes: data.notes,
          appointmentTypeId: data.appointmentTypeId,
          status: data.status || "PENDING",
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          doctor: {
            select: {
              name: true,
              imageUrl: true,
            },
          },
        },
      }).then(async (appointment) => {
        // Invalidate appointment caches
        await this.invalidateCachePattern(`medibook:appointments:doctor:${data.doctorId}*`);
        await this.invalidateCachePattern(`medibook:appointments:patient:${data.userId}*`);
        return appointment;
      });
    }, "Failed to create appointment");
  }

  /**
   * Update appointment
   */
  async update(
    id: string,
    data: UpdateAppointmentData
  ): Promise<Appointment> {
    this.validateRequired({ id }, ["id"]);

    return this.execute(async () => {
      // Check if appointment exists
      const existing = await this.findUnique(id);
      if (!existing) {
        throw new ServerServiceError("Appointment not found", 404, "NOT_FOUND");
      }

      const updateData: Prisma.AppointmentUpdateInput = {};

      if (data.status !== undefined) {
        updateData.status = data.status;
      }

      if (data.date !== undefined) {
        updateData.date = typeof data.date === "string" ? new Date(data.date) : data.date;
      }

      if (data.time !== undefined) {
        // Validate time format
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(data.time)) {
          throw new ServerServiceError(
            "Time must be in HH:MM format (24-hour)",
            400,
            "INVALID_TIME_FORMAT"
          );
        }
        updateData.time = data.time;
      }

      if (data.duration !== undefined) {
        updateData.duration = data.duration;
      }

      if (data.reason !== undefined) {
        updateData.reason = data.reason;
      }

      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }

      return await this.prisma.appointment.update({
        where: { id },
        data: updateData,
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
      }).then(async (appointment) => {
        // Invalidate caches
        await this.invalidateCache(CacheKeys.appointment(id));
        await this.invalidateCachePattern(`medibook:appointments:doctor:${existing.doctorId}*`);
        await this.invalidateCachePattern(`medibook:appointments:patient:${existing.userId}*`);
        return appointment;
      });
    }, "Failed to update appointment");
  }

  /**
   * Delete appointment
   */
  async delete(id: string): Promise<void> {
    this.validateRequired({ id }, ["id"]);

    return this.execute(async () => {
      const appointment = await this.findUnique(id);
      if (appointment) {
        await this.prisma.appointment.delete({
          where: { id },
        });

        // Invalidate caches
        await this.invalidateCache(CacheKeys.appointment(id));
        await this.invalidateCachePattern(`medibook:appointments:doctor:${appointment.doctorId}*`);
        await this.invalidateCachePattern(`medibook:appointments:patient:${appointment.userId}*`);
      }
    }, "Failed to delete appointment");
  }

  /**
   * Get appointments by doctor ID
   */
  async getByDoctor(
    doctorId: string,
    options: Omit<FindAppointmentsOptions, "doctorId"> = {}
  ): Promise<Appointment[]> {
    // Only cache simple queries without filters
    if (!options.status && !options.date && !options.include) {
      return await this.cachedQuerySWR(
        CacheKeys.doctorAppointments(doctorId),
        () => this.findMany({ ...options, doctorId }),
        CacheTTL.SHORT, // 1 minute fresh
        CacheTTL.MEDIUM // 5 minutes stale
      );
    }

    return this.findMany({ ...options, doctorId });
  }

  /**
   * Get appointments by user ID
   */
  async getByUser(
    userId: string,
    options: Omit<FindAppointmentsOptions, "userId"> = {}
  ): Promise<Appointment[]> {
    // Only cache simple queries without filters
    if (!options.status && !options.date && !options.include) {
      return await this.cachedQuerySWR(
        CacheKeys.patientAppointments(userId),
        () => this.findMany({ ...options, userId }),
        CacheTTL.SHORT, // 1 minute fresh
        CacheTTL.MEDIUM // 5 minutes stale
      );
    }

    return this.findMany({ ...options, userId });
  }

  /**
   * Get booked time slots for a doctor on a specific date
   */
  async getBookedSlots(doctorId: string, date: string): Promise<string[]> {
    this.validateRequired({ doctorId, date }, ["doctorId", "date"]);

    return this.execute(async () => {
      const appointmentDate = new Date(date);
      const startOfDay = new Date(appointmentDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(appointmentDate.setHours(23, 59, 59, 999));

      const appointments = await this.prisma.appointment.findMany({
        where: {
          doctorId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            not: "CANCELLED",
          },
        },
        select: {
          time: true,
        },
      });

      return appointments.map((appointment) => appointment.time);
    }, "Failed to get booked slots");
  }

  /**
   * Check if a time slot is available
   */
  async isSlotAvailable(
    doctorId: string,
    date: string,
    time: string
  ): Promise<boolean> {
    this.validateRequired({ doctorId, date, time }, ["doctorId", "date", "time"]);

    return this.execute(async () => {
      const appointmentDate = new Date(date);
      const startOfDay = new Date(appointmentDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(appointmentDate.setHours(23, 59, 59, 999));

      const existing = await this.prisma.appointment.findFirst({
        where: {
          doctorId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          time,
          status: {
            not: "CANCELLED",
          },
        },
      });

      return !existing;
    }, "Failed to check slot availability");
  }

  /**
   * Update appointment status with business logic validation
   */
  async updateStatus(
    id: string,
    status: AppointmentStatus
  ): Promise<Appointment> {
    this.validateRequired({ id, status }, ["id", "status"]);

    return this.execute(async () => {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id },
        include: {
          payment: true,
        },
      });

      if (!appointment) {
        throw new ServerServiceError("Appointment not found", 404, "NOT_FOUND");
      }

      // Business logic: If status changed to CONFIRMED, validate payment
      if (status === "CONFIRMED" && appointment.status !== "CONFIRMED") {
        if (appointment.payment) {
          if (!appointment.payment.patientPaid) {
            throw new ServerServiceError(
              "Cannot confirm appointment: Patient payment not yet processed",
              400,
              "PAYMENT_NOT_PROCESSED"
            );
          }

          if (appointment.payment.status !== "COMPLETED") {
            throw new ServerServiceError(
              `Cannot confirm appointment: Payment status is ${appointment.payment.status}. Payment must be completed.`,
              400,
              "PAYMENT_NOT_COMPLETED"
            );
          }
        }

        // Check doctor payout account
        const doctorPaymentAccount = await this.prisma.doctorPaymentAccount.findUnique({
          where: { doctorId: appointment.doctorId },
          select: {
            accountStatus: true,
            payoutEnabled: true,
          },
        });

        if (!doctorPaymentAccount) {
          throw new ServerServiceError(
            "Cannot confirm appointment: Doctor payout account is not set up",
            400,
            "PAYOUT_ACCOUNT_NOT_SETUP"
          );
        }

        if (
          doctorPaymentAccount.accountStatus !== "ACTIVE" ||
          doctorPaymentAccount.payoutEnabled === false
        ) {
          throw new ServerServiceError(
            "Cannot confirm appointment: Doctor payout account is not active",
            400,
            "PAYOUT_ACCOUNT_NOT_ACTIVE"
          );
        }
      }

      return await this.update(id, { status });
    }, "Failed to update appointment status");
  }

  /**
   * Cancel appointment
   */
  async cancel(id: string, reason?: string): Promise<Appointment> {
    this.validateRequired({ id }, ["id"]);

    return this.execute(async () => {
      const appointment = await this.findUnique(id);

      if (!appointment) {
        throw new ServerServiceError("Appointment not found", 404, "NOT_FOUND");
      }

      if (appointment.status === "CANCELLED") {
        throw new ServerServiceError(
          "Appointment already cancelled",
          400,
          "ALREADY_CANCELLED"
        );
      }

      const updated = await this.update(id, {
        status: "CANCELLED",
        notes: reason ? `Cancelled: ${reason}` : "Cancelled",
      });

      // Send cancellation email
      await emailService.sendAppointmentCancellation(id, reason);

      return updated;
    }, "Failed to cancel appointment");
  }

  /**
   * Reschedule appointment with business logic validation
   */
  async reschedule(
    id: string,
    data: RescheduleAppointmentData
  ): Promise<Appointment> {
    this.validateRequired({ id, ...data }, ["id", "date", "time"]);

    return this.execute(async () => {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id },
        include: {
          doctor: {
            include: {
              availability: true,
            },
          },
        },
      });

      if (!appointment) {
        throw new ServerServiceError("Appointment not found", 404, "NOT_FOUND");
      }

      // Check if appointment can be rescheduled
      if (appointment.status === "COMPLETED") {
        throw new ServerServiceError(
          "Cannot reschedule a completed appointment",
          400,
          "CANNOT_RESCHEDULE_COMPLETED"
        );
      }

      if (appointment.status === "CANCELLED") {
        throw new ServerServiceError(
          "Cannot reschedule a cancelled appointment",
          400,
          "CANNOT_RESCHEDULE_CANCELLED"
        );
      }

      // Check cancellation window
      const appointmentDateTime = new Date(
        `${appointment.date.toISOString().split("T")[0]}T${appointment.time}`
      );
      const now = new Date();
      const hoursUntilAppointment =
        (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      const minBookingHours =
        appointment.doctor?.availability?.minBookingHours || 24;
      if (hoursUntilAppointment < minBookingHours) {
        throw new ServerServiceError(
          `Cannot reschedule appointment. Please reschedule at least ${minBookingHours} hours before the appointment time.`,
          400,
          "RESCHEDULE_TOO_LATE"
        );
      }

      // Check if new time slot is available
      const isAvailable = await this.isSlotAvailable(
        appointment.doctorId,
        data.date,
        data.time
      );

      if (!isAvailable) {
        // Double-check excluding current appointment
        const newDate = new Date(data.date);
        const bookedSlots = await this.prisma.appointment.findMany({
          where: {
            doctorId: appointment.doctorId,
            date: newDate,
            time: data.time,
            status: {
              not: "CANCELLED",
            },
            id: {
              not: id,
            },
          },
        });

        if (bookedSlots.length > 0) {
          throw new ServerServiceError(
            "This time slot is already booked. Please choose another time.",
            400,
            "SLOT_ALREADY_BOOKED"
          );
        }
      }

      // Reschedule the appointment
      const updated = await this.update(id, {
        date: data.date,
        time: data.time,
        status: "PENDING", // Reset to pending for doctor confirmation
      });

      // Send reschedule email
      await emailService.sendAppointmentReschedule(id, appointment.date, appointment.time);

      return updated;
    }, "Failed to reschedule appointment");
  }

  /**
   * Get appointment with appointment type details
   */
  async findUniqueWithType(id: string): Promise<Appointment & { appointmentType?: unknown }> {
    const appointment = await this.findUnique(id);

    if (!appointment) {
      throw new ServerServiceError("Appointment not found", 404, "NOT_FOUND");
    }

    let appointmentType = null;
    if (appointment.appointmentTypeId) {
      appointmentType = await this.prisma.doctorAppointmentType.findUnique({
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

    return {
      ...appointment,
      appointmentType,
    } as Appointment & { appointmentType?: unknown };
  }
}

// Export singleton instance
export const appointmentsServerService = new AppointmentsServerService();

