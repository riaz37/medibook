/**
 * Doctor Configuration Service
 * Handles doctor-specific settings: availability, appointment types, working hours
 */

import prisma from "@/lib/prisma";
import { BaseService, ApiException } from "./base.service";
import { ApplicationStatus, AppointmentStatus } from "@/generated/prisma";



class DoctorsConfigService extends BaseService {
  /**
   * Get doctor availability configuration
   */
  async getAvailability(doctorId: string): Promise<{
    timeSlots: string[];
    slotDuration: number;
    bookingAdvanceDays: number;
    minBookingHours: number;
  }> {
    try {
      const availability = await prisma.doctorAvailability.findUnique({
        where: { doctorId },
      });

      if (!availability) {
        // Return default availability
        return {
          timeSlots: [] as string[],
          slotDuration: 30,
          bookingAdvanceDays: 30,
          minBookingHours: 24,
        };
      }

      return {
        ...availability,
        timeSlots: JSON.parse(availability.timeSlots || "[]") as string[],
      };
    } catch (error) {
      throw this.handleError(error, "Failed to fetch doctor availability");
    }
  }

  /**
   * Update doctor availability
   */
  async updateAvailability(
    doctorId: string,
    data: {
      timeSlots?: string[];
      slotDuration?: number;
      bookingAdvanceDays?: number;
      minBookingHours?: number;
    }
  ) {
    try {
      const availability = await prisma.doctorAvailability.upsert({
        where: { doctorId },
        create: {
          doctorId,
          timeSlots: JSON.stringify(data.timeSlots || []),
          slotDuration: data.slotDuration || 30,
          bookingAdvanceDays: data.bookingAdvanceDays || 30,
          minBookingHours: data.minBookingHours || 24,
        },
        update: {
          timeSlots: data.timeSlots ? JSON.stringify(data.timeSlots) : undefined,
          slotDuration: data.slotDuration,
          bookingAdvanceDays: data.bookingAdvanceDays,
          minBookingHours: data.minBookingHours,
        },
      });

      return {
        ...availability,
        timeSlots: JSON.parse(availability.timeSlots || "[]") as string[],
      };
    } catch (error) {
      throw this.handleError(error, "Failed to update doctor availability");
    }
  }

  /**
   * Get doctor working hours
   */
  async getWorkingHours(doctorId: string) {
    try {
      const workingHours = await prisma.doctorWorkingHours.findMany({
        where: { doctorId },
        orderBy: { dayOfWeek: "asc" },
      });

      return workingHours;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch working hours");
    }
  }

  /**
   * Update doctor working hours
   */
  async updateWorkingHours(
    doctorId: string,
    hours: Array<{
      dayOfWeek: number;
      startTime?: string | null;
      endTime?: string | null;
      isWorking: boolean;
    }>
  ) {
    try {
      // Delete existing hours
      await prisma.doctorWorkingHours.deleteMany({
        where: { doctorId },
      });

      // Create new hours - only include startTime/endTime if isWorking is true
      const created = await prisma.doctorWorkingHours.createMany({
        data: hours
          .filter((h) => h.isWorking && h.startTime && h.endTime)
          .map((h) => ({
            doctorId,
            dayOfWeek: h.dayOfWeek,
            startTime: h.startTime!,
            endTime: h.endTime!,
            isWorking: h.isWorking,
          })),
      });

      return created;
    } catch (error) {
      throw this.handleError(error, "Failed to update working hours");
    }
  }

  /**
   * Get doctor appointment types
   */
  async getAppointmentTypes(doctorId: string) {
    try {
      const types = await prisma.doctorAppointmentType.findMany({
        where: { doctorId, isActive: true },
        orderBy: { createdAt: "asc" },
      });

      return types;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch appointment types");
    }
  }

  /**
   * Create appointment type for doctor
   */
  async createAppointmentType(
    doctorId: string,
    data: {
      name: string;
      duration: number;
      description?: string;
      price?: number;
    }
  ) {
    try {
      const type = await prisma.doctorAppointmentType.create({
        data: {
          doctorId,
          name: data.name,
          duration: data.duration,
          description: data.description,
          price: data.price ? data.price : null,
        },
      });

      return type;
    } catch (error) {
      throw this.handleError(error, "Failed to create appointment type");
    }
  }

  /**
   * Update appointment type
   */
  async updateAppointmentType(
    typeId: string,
    doctorId: string,
    data: {
      name?: string;
      duration?: number;
      description?: string;
      price?: number;
      isActive?: boolean;
    }
  ) {
    try {
      const type = await prisma.doctorAppointmentType.update({
        where: { id: typeId },
        data: {
          ...data,
          price: data.price !== undefined ? data.price : undefined,
        },
      });

      // Verify doctor owns this type
      if (type.doctorId !== doctorId) {
        throw new ApiException("Unauthorized", 403);
      }

      return type;
    } catch (error) {
      throw this.handleError(error, "Failed to update appointment type");
    }
  }

  /**
   * Delete appointment type
   */
  async deleteAppointmentType(typeId: string, doctorId: string) {
    try {
      const type = await prisma.doctorAppointmentType.findUnique({
        where: { id: typeId },
      });

      if (!type || type.doctorId !== doctorId) {
        throw new ApiException("Unauthorized", 403);
      }

      await prisma.doctorAppointmentType.delete({
        where: { id: typeId },
      });

      return { success: true };
    } catch (error) {
      throw this.handleError(error, "Failed to delete appointment type");
    }
  }

  /**
   * Get available time slots for a doctor on a specific date
   * @param doctorId - Doctor ID
   * @param date - Date in YYYY-MM-DD format
   * @param appointmentDuration - Optional appointment duration in minutes. If provided, only returns slots that can accommodate this duration.
   */
  async getAvailableTimeSlots(doctorId: string, date: string, appointmentDuration?: number): Promise<string[]> {
    try {
      const availability = await this.getAvailability(doctorId);
      const workingHours = await this.getWorkingHours(doctorId);

      // Get day of week (0 = Sunday, 1 = Monday, etc.)
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay();

      // Check if doctor works on this day
      const daySchedule = workingHours.find((wh: { dayOfWeek: number }) => wh.dayOfWeek === dayOfWeek);

      if (!daySchedule || !daySchedule.isWorking) {
        return []; // Doctor doesn't work on this day
      }

      // Get booked appointments for this date
      const bookedAppointments = await prisma.appointment.findMany({
        where: {
          doctorId,
          date: new Date(date),
          status: {
            in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
          },
        },
        select: {
          time: true,
          duration: true,
        },
      });

      // Generate time slots based on working hours and availability settings
      const slots: string[] = [];
      const [startHour, startMin] = daySchedule.startTime.split(":").map(Number);
      const [endHour, endMin] = daySchedule.endTime.split(":").map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const slotDuration = availability.slotDuration;
      
      // Use appointment duration if provided, otherwise use slot duration
      const requiredDuration = appointmentDuration || slotDuration;

      // Generate slots
      for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const timeSlot = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;

        // Check if slot is in doctor's available time slots
        if (availability.timeSlots.length === 0 || availability.timeSlots.includes(timeSlot)) {
          const slotStart = minutes;
          const slotEnd = minutes + slotDuration;
          const appointmentEnd = minutes + requiredDuration;

          // Check if appointment would extend beyond working hours
          if (appointmentEnd > endMinutes) {
            continue; // Skip this slot - appointment would extend beyond working hours
          }

          // Check if slot is not booked (considering duration)
          const isBooked = bookedAppointments.some((apt) => {
            const [aptHour, aptMin] = apt.time.split(":").map(Number);
            const aptStart = aptHour * 60 + aptMin;
            const aptEnd = aptStart + apt.duration;

            // Check for overlap between requested appointment and existing appointment
            return (slotStart >= aptStart && slotStart < aptEnd) ||
              (appointmentEnd > aptStart && appointmentEnd <= aptEnd) ||
              (slotStart <= aptStart && appointmentEnd >= aptEnd);
          });

          // If appointment duration is longer than slot duration, check if consecutive slots are available
          if (requiredDuration > slotDuration) {
            const slotsNeeded = Math.ceil(requiredDuration / slotDuration);
            let allSlotsAvailable = true;

            // Check each consecutive slot needed for this appointment
            for (let i = 0; i < slotsNeeded; i++) {
              const checkSlotStart = minutes + (i * slotDuration);
              const checkSlotEnd = checkSlotStart + slotDuration;

              // Check if this slot extends beyond working hours
              if (checkSlotEnd > endMinutes) {
                allSlotsAvailable = false;
                break;
              }

              // Check if this slot overlaps with any booked appointment
              const slotOverlaps = bookedAppointments.some((apt) => {
                const [aptHour, aptMin] = apt.time.split(":").map(Number);
                const aptStart = aptHour * 60 + aptMin;
                const aptEnd = aptStart + apt.duration;

                return (checkSlotStart >= aptStart && checkSlotStart < aptEnd) ||
                  (checkSlotEnd > aptStart && checkSlotEnd <= aptEnd) ||
                  (checkSlotStart <= aptStart && checkSlotEnd >= aptEnd);
              });

              if (slotOverlaps) {
                allSlotsAvailable = false;
                break;
              }
            }

            if (!allSlotsAvailable) {
              continue; // Skip this slot - not enough consecutive free slots
            }
          }

          if (!isBooked) {
            slots.push(timeSlot);
          }
        }
      }

      return slots;
    } catch (error) {
      throw this.handleError(error, "Failed to get available time slots");
    }
  }

  private handleError(error: unknown, defaultMessage: string): ApiException {
    if (error instanceof ApiException) {
      return error;
    }
    return new ApiException(
      error instanceof Error ? error.message : defaultMessage,
      undefined,
      error
    );
  }
}

export const doctorsConfigService = new DoctorsConfigService();

