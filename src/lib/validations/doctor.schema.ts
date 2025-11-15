import { z } from "zod";

/**
 * Gender Enum
 */
export const GenderSchema = z.enum(["MALE", "FEMALE"]);

/**
 * Create Doctor Schema
 */
export const createDoctorSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email format"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number format"),
  speciality: z.string().min(1, "Speciality is required").max(100, "Speciality is too long"),
  gender: GenderSchema,
  bio: z.string().max(500, "Bio is too long").optional().nullable(),
});

/**
 * Update Doctor Schema
 */
export const updateDoctorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z
    .string()
    .min(10)
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .optional(),
  speciality: z.string().min(1).max(100).optional(),
  gender: GenderSchema.optional(),
  bio: z.string().max(500).optional().nullable(),
});

/**
 * Helper schema for optional URL fields that can be empty string, null, or valid URL
 */
const optionalUrlSchema = z
  .union([
    z.string().url(),
    z.literal(""),
    z.null(),
    z.undefined(),
  ])
  .transform((val) => (val === "" ? null : val))
  .nullable()
  .optional();

/**
 * Doctor Verification Schema
 */
export const doctorVerificationSchema = z.object({
  licenseUrl: z
    .string()
    .url("License URL must be a valid URL")
    .min(1, "Medical license is required"),
  certificateUrl: optionalUrlSchema,
  idDocumentUrl: optionalUrlSchema,
  otherDocuments: z.array(z.string().url()).optional().nullable(),
});

/**
 * Update Verification Status Schema (Admin only)
 */
export const updateVerificationStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  rejectionReason: z.string().max(500).optional().nullable(),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type DoctorVerificationInput = z.infer<typeof doctorVerificationSchema>;
export type UpdateVerificationStatusInput = z.infer<typeof updateVerificationStatusSchema>;

