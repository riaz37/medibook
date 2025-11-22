import { z } from "zod";

/**
 * Prescription Status Enum
 */
export const PrescriptionStatusSchema = z.enum([
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
  "COMPLETED",
]);

/**
 * Refill Status Enum
 */
export const RefillStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
]);

/**
 * Prescription Item Schema
 * Individual medication in a prescription
 */
export const prescriptionItemSchema = z.object({
  medicationId: z.string().optional().nullable(),
  medicationName: z
    .string()
    .min(1, "Medication name is required")
    .max(200, "Medication name is too long"),
  dosage: z
    .string()
    .min(1, "Dosage is required")
    .max(100, "Dosage description is too long"),
  frequency: z
    .string()
    .min(1, "Frequency is required")
    .max(100, "Frequency description is too long"),
  duration: z
    .string()
    .min(1, "Duration is required")
    .max(100, "Duration description is too long"),
  instructions: z
    .string()
    .max(500, "Instructions are too long")
    .optional()
    .nullable(),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be positive")
    .optional()
    .nullable(),
  refillsAllowed: z
    .number()
    .int("Refills allowed must be an integer")
    .min(0, "Refills allowed cannot be negative")
    .max(12, "Maximum 12 refills allowed")
    .default(0),
});

/**
 * Create Prescription Schema
 */
export const createPrescriptionSchema = z.object({
  appointmentId: z
    .string()
    .min(1, "Appointment ID is required")
    .optional()
    .nullable(),
  patientId: z.string().min(1, "Patient ID is required"),
  items: z
    .array(prescriptionItemSchema)
    .min(1, "At least one medication is required")
    .max(20, "Maximum 20 medications per prescription"),
  expiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional()
    .nullable()
    .refine(
      (date) => {
        if (!date) return true;
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      },
      {
        message: "Expiry date must be today or in the future",
      }
    ),
  notes: z.string().max(1000, "Notes are too long").optional().nullable(),
});

/**
 * Update Prescription Schema
 */
export const updatePrescriptionSchema = z.object({
  status: PrescriptionStatusSchema.optional(),
  expiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional()
    .nullable()
    .refine(
      (date) => {
        if (!date) return true;
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      },
      {
        message: "Expiry date must be today or in the future",
      }
    ),
  notes: z.string().max(1000, "Notes are too long").optional().nullable(),
  items: z
    .array(prescriptionItemSchema.extend({ id: z.string().optional() }))
    .optional(),
});

/**
 * Request Refill Schema
 */
export const requestRefillSchema = z.object({
  notes: z.string().max(500, "Notes are too long").optional().nullable(),
});

/**
 * Approve/Reject Refill Schema
 */
export const processRefillSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().max(500, "Notes are too long").optional().nullable(),
});

/**
 * Medication Search Schema
 */
export const medicationSearchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(100, "Search query is too long"),
  limit: z
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit cannot exceed 50")
    .default(10)
    .optional(),
});

/**
 * Type exports
 */
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type UpdatePrescriptionInput = z.infer<typeof updatePrescriptionSchema>;
export type PrescriptionItemInput = z.infer<typeof prescriptionItemSchema>;
export type RequestRefillInput = z.infer<typeof requestRefillSchema>;
export type ProcessRefillInput = z.infer<typeof processRefillSchema>;
export type MedicationSearchInput = z.infer<typeof medicationSearchSchema>;

