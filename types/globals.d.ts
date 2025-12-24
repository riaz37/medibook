export {};
// Create a type for the roles
export type Roles = "patient" | "doctor_pending" | "doctor" | "admin";

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles;
      doctorId?: string; // Store doctor profile ID for quick access
    };
  }
}
