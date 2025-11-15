import { z } from "zod";

/**
 * Appointment Status Enum
 */
export const AppointmentStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
]);

/**
 * Book Appointment Schema
 */
export const bookAppointmentSchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
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
        message: "Appointment date must be today or in the future",
      }
    ),
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format (24-hour)"),
  reason: z.string().optional(),
  appointmentTypeId: z.string().min(1, "Appointment type is required"),
  userId: z.string().optional(), // Optional for VAPI calls
});

/**
 * Update Appointment Status Schema
 */
export const updateAppointmentStatusSchema = z.object({
  status: AppointmentStatusSchema,
});

/**
 * Appointment Query Schema (for filtering)
 */
export const appointmentQuerySchema = z.object({
  doctorId: z.string().optional(),
  status: AppointmentStatusSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>;

