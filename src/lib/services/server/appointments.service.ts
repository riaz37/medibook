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
import { doctorsConfigService } from "../doctors-config.service";
import { stripe } from "@/lib/stripe";

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
      const now = new Date();

      // Validate date is in the future
      if (appointmentDate < now) {
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

      // Get doctor availability configuration
      const availability = await doctorsConfigService.getAvailability(data.doctorId);
      const workingHours = await doctorsConfigService.getWorkingHours(data.doctorId);

      // Validate bookingAdvanceDays
      const dateStr = appointmentDate.toISOString().split("T")[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const appointmentDay = new Date(appointmentDate);
      appointmentDay.setHours(0, 0, 0, 0);
      const daysUntilAppointment = Math.ceil((appointmentDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilAppointment > availability.bookingAdvanceDays) {
        throw new ServerServiceError(
          `Cannot book more than ${availability.bookingAdvanceDays} days in advance`,
          400,
          "BOOKING_TOO_FAR_ADVANCE"
        );
      }

      // Validate minBookingHours
      const appointmentDateTime = new Date(`${dateStr}T${data.time}`);
      const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilAppointment < availability.minBookingHours) {
        throw new ServerServiceError(
          `Appointments must be booked at least ${availability.minBookingHours} hours in advance`,
          400,
          "BOOKING_TOO_SOON"
        );
      }

      // Validate doctor works on this day
      const dayOfWeek = appointmentDate.getDay();
      const daySchedule = workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);

      if (!daySchedule || !daySchedule.isWorking) {
        throw new ServerServiceError(
          "Doctor does not work on this day",
          400,
          "DOCTOR_NOT_WORKING"
        );
      }

      // Validate appointment doesn't extend beyond working hours
      const [timeHour, timeMin] = data.time.split(":").map(Number);
      const appointmentStartMinutes = timeHour * 60 + timeMin;
      const appointmentEndMinutes = appointmentStartMinutes + data.duration;
      const [endHour, endMin] = daySchedule.endTime.split(":").map(Number);
      const workingEndMinutes = endHour * 60 + endMin;

      if (appointmentEndMinutes > workingEndMinutes) {
        throw new ServerServiceError(
          `Appointment would extend beyond doctor's working hours (ends at ${daySchedule.endTime})`,
          400,
          "APPOINTMENT_EXCEEDS_WORKING_HOURS"
        );
      }

      // Validate slot availability (considering duration) - quick check before transaction
      const availableSlots = await doctorsConfigService.getAvailableTimeSlots(
        data.doctorId,
        dateStr,
        data.duration
      );

      if (!availableSlots.includes(data.time)) {
        throw new ServerServiceError(
          "This time slot is no longer available. Please choose another time.",
          409,
          "SLOT_NOT_AVAILABLE"
        );
      }

      // Final validation and creation happens in transaction to prevent race conditions

      // Use transaction to prevent concurrent booking
      const appointment = await this.prisma.$transaction(async (tx) => {
        // Double-check availability within transaction (prevents race conditions)
        const conflictingAppointments = await tx.appointment.findMany({
          where: {
            doctorId: data.doctorId,
            date: appointmentDate,
            status: {
              not: "CANCELLED",
            },
          },
          select: {
            time: true,
            duration: true,
          },
        });

        const [apptHour, apptMin] = data.time.split(":").map(Number);
        const apptStart = apptHour * 60 + apptMin;
        const apptEnd = apptStart + data.duration;

        const hasConflict = conflictingAppointments.some((apt) => {
          const [aptHour, aptMin] = apt.time.split(":").map(Number);
          const aptStart = aptHour * 60 + aptMin;
          const aptEnd = aptStart + apt.duration;

          return (apptStart >= aptStart && apptStart < aptEnd) ||
            (apptEnd > aptStart && apptEnd <= aptEnd) ||
            (apptStart <= aptStart && apptEnd >= aptEnd);
        });

        if (hasConflict) {
          throw new ServerServiceError(
            "This time slot was just booked by another user. Please choose another time.",
            409,
            "SLOT_CONFLICT"
          );
        }

        // Create appointment within transaction
        return await tx.appointment.create({
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
        });
      });

      // Invalidate appointment caches after successful creation
      await this.invalidateCachePattern(`medibook:appointments:doctor:${data.doctorId}*`);
      await this.invalidateCachePattern(`medibook:appointments:patient:${data.userId}*`);
      
      return appointment;
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
   * @param doctorId - Doctor ID
   * @param date - Date in YYYY-MM-DD format
   * @param time - Time in HH:MM format
   * @param duration - Optional appointment duration in minutes. If provided, checks if consecutive slots are available.
   */
  async isSlotAvailable(
    doctorId: string,
    date: string,
    time: string,
    duration?: number
  ): Promise<boolean> {
    this.validateRequired({ doctorId, date, time }, ["doctorId", "date", "time"]);

    return this.execute(async () => {
      const appointmentDate = new Date(date);
      const startOfDay = new Date(appointmentDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(appointmentDate.setHours(23, 59, 59, 999));

      // Get all appointments for this date
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
          duration: true,
        },
      });

      const [timeHour, timeMin] = time.split(":").map(Number);
      const slotStart = timeHour * 60 + timeMin;
      const slotDuration = duration || 30; // Default to 30 minutes if not provided
      const slotEnd = slotStart + slotDuration;

      // Check for overlaps with existing appointments
      const hasOverlap = appointments.some((apt) => {
        const [aptHour, aptMin] = apt.time.split(":").map(Number);
        const aptStart = aptHour * 60 + aptMin;
        const aptEnd = aptStart + apt.duration;

        return (slotStart >= aptStart && slotStart < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (slotStart <= aptStart && slotEnd >= aptEnd);
      });

      return !hasOverlap;
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

      // Validate status transitions (state machine)
      const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
        PENDING: ["CONFIRMED", "CANCELLED"],
        CONFIRMED: ["COMPLETED", "CANCELLED"],
        COMPLETED: [], // Cannot transition from COMPLETED
        CANCELLED: [], // Cannot transition from CANCELLED
      };

      if (appointment.status !== status) {
        const allowedTransitions = validTransitions[appointment.status];
        if (!allowedTransitions.includes(status)) {
          throw new ServerServiceError(
            `Cannot transition appointment from ${appointment.status} to ${status}. Valid transitions: ${allowedTransitions.join(", ")}`,
            400,
            "INVALID_STATUS_TRANSITION"
          );
        }
      }

      // Business logic: If status changed to CONFIRMED, validate payment
      if (status === "CONFIRMED" && appointment.status !== "CONFIRMED") {
        if (appointment.payment) {
          let paymentProcessed = appointment.payment.patientPaid;
          let paymentStatus = appointment.payment.status;

          // If database shows payment not processed but there's a Stripe payment intent,
          // check Stripe directly to handle race condition with webhook
          if (!paymentProcessed && appointment.payment.stripePaymentIntentId) {
            try {
              const paymentIntent = await stripe.paymentIntents.retrieve(
                appointment.payment.stripePaymentIntentId
              );

              // If Stripe confirms payment succeeded, update database and proceed
              if (paymentIntent.status === "succeeded") {
                await this.prisma.appointmentPayment.update({
                  where: { id: appointment.payment.id },
                  data: {
                    patientPaid: true,
                    patientPaidAt: new Date(),
                    status: "COMPLETED",
                    stripeChargeId: paymentIntent.latest_charge as string || undefined,
                  },
                });
                paymentProcessed = true;
                paymentStatus = "COMPLETED";
              }
            } catch (error) {
              // If Stripe check fails, log but don't block - use database state
              console.error("Failed to verify payment with Stripe:", error);
            }
          }

          if (!paymentProcessed) {
            throw new ServerServiceError(
              "Cannot confirm appointment: Patient payment not yet processed",
              400,
              "PAYMENT_NOT_PROCESSED"
            );
          }

          if (paymentStatus !== "COMPLETED") {
            throw new ServerServiceError(
              `Cannot confirm appointment: Payment status is ${paymentStatus}. Payment must be completed.`,
              400,
              "PAYMENT_NOT_COMPLETED"
            );
          }
        }

        // Check doctor payout account (only warn, don't block confirmation)
        // Payment has been received, so appointment should be confirmed
        // Payout can be set up/enabled later
        if (appointment.payment && appointment.payment.appointmentPrice && Number(appointment.payment.appointmentPrice) > 0) {
          const doctorPaymentAccount = await this.prisma.doctorPaymentAccount.findUnique({
            where: { doctorId: appointment.doctorId },
            select: {
              accountStatus: true,
              payoutEnabled: true,
            },
          });

          if (!doctorPaymentAccount) {
            console.warn(
              `Appointment ${appointment.id} confirmed but doctor ${appointment.doctorId} payout account not set up. Payout will be delayed.`
            );
          } else if (
            doctorPaymentAccount.accountStatus !== "ACTIVE" ||
            doctorPaymentAccount.payoutEnabled === false
          ) {
            console.warn(
              `Appointment ${appointment.id} confirmed but doctor ${appointment.doctorId} payout account not active. Payout will be delayed.`
            );
          }
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

      // Get doctor availability configuration
      const availability = await doctorsConfigService.getAvailability(appointment.doctorId);
      const workingHours = await doctorsConfigService.getWorkingHours(appointment.doctorId);

      // Validate new date is in the future
      const newAppointmentDate = new Date(data.date);
      const now = new Date();
      if (newAppointmentDate < now) {
        throw new ServerServiceError(
          "New appointment date must be in the future",
          400,
          "INVALID_DATE"
        );
      }

      // Validate bookingAdvanceDays for new date
      const dateStr = newAppointmentDate.toISOString().split("T")[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const appointmentDay = new Date(newAppointmentDate);
      appointmentDay.setHours(0, 0, 0, 0);
      const daysUntilAppointment = Math.ceil((appointmentDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilAppointment > availability.bookingAdvanceDays) {
        throw new ServerServiceError(
          `Cannot reschedule more than ${availability.bookingAdvanceDays} days in advance`,
          400,
          "RESCHEDULE_TOO_FAR_ADVANCE"
        );
      }

      // Validate minBookingHours for new date/time
      const newAppointmentDateTime = new Date(`${dateStr}T${data.time}`);
      const hoursUntilNewAppointment = (newAppointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilNewAppointment < availability.minBookingHours) {
        throw new ServerServiceError(
          `Cannot reschedule. New appointment must be at least ${availability.minBookingHours} hours in the future`,
          400,
          "RESCHEDULE_TOO_SOON"
        );
      }

      // Validate doctor works on new day
      const dayOfWeek = newAppointmentDate.getDay();
      const daySchedule = workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);

      if (!daySchedule || !daySchedule.isWorking) {
        throw new ServerServiceError(
          "Doctor does not work on the selected day",
          400,
          "DOCTOR_NOT_WORKING"
        );
      }

      // Validate new appointment doesn't extend beyond working hours
      const [timeHour, timeMin] = data.time.split(":").map(Number);
      const appointmentStartMinutes = timeHour * 60 + timeMin;
      const appointmentEndMinutes = appointmentStartMinutes + appointment.duration;
      const [endHour, endMin] = daySchedule.endTime.split(":").map(Number);
      const workingEndMinutes = endHour * 60 + endMin;

      if (appointmentEndMinutes > workingEndMinutes) {
        throw new ServerServiceError(
          `New appointment would extend beyond doctor's working hours (ends at ${daySchedule.endTime})`,
          400,
          "APPOINTMENT_EXCEEDS_WORKING_HOURS"
        );
      }

      // Check if new time slot is available (considering appointment duration)
      const isAvailable = await this.isSlotAvailable(
        appointment.doctorId,
        data.date,
        data.time,
        appointment.duration
      );

      if (!isAvailable) {
        throw new ServerServiceError(
          "This time slot is no longer available. Please choose another time.",
          409,
          "SLOT_NOT_AVAILABLE"
        );
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
  async findUniqueWithType(id: string): Promise<Appointment & { appointmentType?: unknown; prescription?: unknown }> {
    const appointment = await this.findUnique(id, {
      prescription: {
        select: {
          id: true,
          status: true,
          issueDate: true,
        },
      },
    });

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
    } as Appointment & { appointmentType?: unknown; prescription?: unknown };
  }
}

// Export singleton instance
export const appointmentsServerService = new AppointmentsServerService();

