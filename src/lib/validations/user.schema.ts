import { z } from "zod";

/**
 * User Role Enum
 */
export const UserRoleSchema = z.enum(["PATIENT", "DOCTOR", "ADMIN"]);

/**
 * Select Role Schema
 */
export const selectRoleSchema = z.object({
  role: UserRoleSchema,
});

/**
 * Update User Profile Schema
 */
export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name is too long").optional(),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name is too long").optional(),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number format")
    .optional()
    .nullable(),
});

/**
 * User Profile Form Schema (for client-side forms)
 * Makes firstName and lastName required for form validation
 */
export const userProfileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true; // Empty is allowed
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
        if (!phoneRegex.test(val)) return false;
        return val.replace(/\D/g, "").length >= 10;
      },
      {
        message: "Phone number must be at least 10 digits and in valid format",
      }
    )
    .nullable(),
  email: z.string().email().optional(), // Read-only, not validated for updates
});

export type SelectRoleInput = z.infer<typeof selectRoleSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type UserProfileFormInput = z.infer<typeof userProfileFormSchema>;

