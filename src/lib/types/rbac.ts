/**
 * RBAC Type Definitions
 * Centralized types for role-based access control
 */

import { ApplicationStatus } from "@/generated/prisma/client";

/**
 * Role type matching Prisma Role model
 * - patient: Regular patients
 * - doctor_pending: Doctors who signed up but are pending admin approval
 * - doctor: Verified doctors with full access
 * - admin: Administrators
 */
export type Role = "patient" | "doctor_pending" | "doctor" | "admin";

/**
 * Permission action types
 */
export type PermissionAction =
  | "read"
  | "write"
  | "delete"
  | "manage"
  | "approve"
  | "reject";

/**
 * Resource types that can be protected
 */
export type Resource =
  | "appointments"
  | "patients"
  | "doctors"
  | "prescriptions"
  | "payments"
  | "users"
  | "settings"
  | "applications"
  | "verifications";

/**
 * Permission definition
 */
export interface Permission {
  resource: Resource;
  action: PermissionAction;
}

/**
 * Role permissions mapping
 */
export type RolePermissions = {
  [key in Role]: Permission[];
};

/**
 * Doctor application data
 */
export interface DoctorApplicationData {
  speciality: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  bio?: string;
  // Verification documents
  licenseUrl?: string;
  certificateUrl?: string;
  idDocumentUrl?: string;
}

/**
 * Doctor application with status
 */
export interface DoctorApplication extends DoctorApplicationData {
  id: string;
  userId: string;
  status: ApplicationStatus;
  submittedAt: Date;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Doctor application with user information (returned from API)
 */
export interface ApplicationWithUser extends DoctorApplication {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  };
}

/**
 * Role change audit entry
 */
export interface RoleChangeAuditEntry {
  id: string;
  userId: string;
  oldRole: Role;
  newRole: Role;
  changedBy: string;
  reason?: string | null;
  changedAt: Date;
}

/**
 * Role change request
 */
export interface RoleChangeRequest {
  userId: string;
  newRole: Role;
  reason?: string;
}

/**
 * Check permission result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}
