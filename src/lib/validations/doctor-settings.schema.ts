import { z } from "zod";

/**
 * Doctor Availability Schema
 */
export const doctorAvailabilitySchema = z.object({
  timeSlots: z
    .array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"))
    .default([]),
  slotDuration: z
    .number()
    .int("Duration must be an integer")
    .min(15, "Minimum slot duration is 15 minutes")
    .max(240, "Maximum slot duration is 240 minutes")
    .default(30),
  bookingAdvanceDays: z
    .number()
    .int("Booking advance days must be an integer")
    .min(1, "Must allow at least 1 day in advance")
    .max(365, "Cannot book more than 365 days in advance")
    .default(30),
  minBookingHours: z
    .number()
    .int("Minimum booking hours must be an integer")
    .min(1, "Minimum booking hours must be at least 1")
    .max(168, "Maximum booking hours is 168 (1 week)")
    .default(24),
});

/**
 * Working Hours Schema (for a single day)
 */
export const workingHourSchema = z.object({
  dayOfWeek: z
    .number()
    .int("Day of week must be an integer")
    .min(0, "Day of week must be 0-6 (Sunday-Saturday)")
    .max(6, "Day of week must be 0-6 (Sunday-Saturday)"),
  isWorking: z.boolean().default(false),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Start time must be in HH:MM format")
    .optional()
    .nullable(),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "End time must be in HH:MM format")
    .optional()
    .nullable(),
}).refine(
  (data) => {
    if (!data.isWorking) return true;
    if (!data.startTime || !data.endTime) return false;
    return data.startTime < data.endTime;
  },
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
);

/**
 * Update Working Hours Schema (array of days)
 */
export const updateWorkingHoursSchema = z.object({
  workingHours: z.array(workingHourSchema).length(7, "Must provide working hours for all 7 days"),
});

/**
 * Appointment Type Schema
 */
export const appointmentTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  duration: z
    .number()
    .int("Duration must be an integer")
    .min(15, "Minimum duration is 15 minutes")
    .max(240, "Maximum duration is 240 minutes"),
  price: z
    .number()
    .nonnegative("Price cannot be negative")
    .max(10000, "Price is too high")
    .optional()
    .nullable(),
  description: z.string().max(500, "Description is too long").optional().nullable(),
  isActive: z.boolean().default(true),
});

/**
 * Create Appointment Type Schema
 */
export const createAppointmentTypeSchema = appointmentTypeSchema;

/**
 * Update Appointment Type Schema
 */
export const updateAppointmentTypeSchema = appointmentTypeSchema.partial().extend({
  name: z.string().min(1).max(100).optional(),
  duration: z.number().int().min(15).max(240).optional(),
});

/**
 * Available Slots Query Schema
 */
export const availableSlotsQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine(
      (date) => {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      },
      {
        message: "Date must be today or in the future",
      }
    ),
  duration: z.coerce
    .number()
    .int("Duration must be an integer")
    .min(15, "Minimum duration is 15 minutes")
    .max(240, "Maximum duration is 240 minutes")
    .optional(),
});

export type DoctorAvailabilityInput = z.infer<typeof doctorAvailabilitySchema>;
export type WorkingHourInput = z.infer<typeof workingHourSchema>;
export type UpdateWorkingHoursInput = z.infer<typeof updateWorkingHoursSchema>;
export type AppointmentTypeInput = z.infer<typeof appointmentTypeSchema>;
export type CreateAppointmentTypeInput = z.infer<typeof createAppointmentTypeSchema>;
export type UpdateAppointmentTypeInput = z.infer<typeof updateAppointmentTypeSchema>;
export type AvailableSlotsQueryInput = z.infer<typeof availableSlotsQuerySchema>;

