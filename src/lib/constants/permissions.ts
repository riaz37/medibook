/**
 * Permission Constants
 * Defines what each role can do
 */

import type { RolePermissions, Permission } from "@/lib/types/rbac";

/**
 * Patient permissions
 */
const patientPermissions: Permission[] = [
  { resource: "appointments", action: "read" },
  { resource: "appointments", action: "write" },
  { resource: "appointments", action: "delete" },
  { resource: "prescriptions", action: "read" },
  { resource: "payments", action: "read" },
  { resource: "payments", action: "write" },
];

/**
 * Doctor pending permissions (limited - can access doctor routes but see pending message)
 */
const doctorPendingPermissions: Permission[] = [
  // Same as patient permissions for now
  ...patientPermissions,
  // Can view doctor dashboard but with limited features
  { resource: "appointments", action: "read" },
];

/**
 * Doctor permissions (full doctor access)
 */
const doctorPermissions: Permission[] = [
  // Inherit patient permissions
  ...patientPermissions,
  // Doctor-specific permissions
  { resource: "appointments", action: "manage" },
  { resource: "patients", action: "read" },
  { resource: "prescriptions", action: "write" },
  { resource: "prescriptions", action: "manage" },
  { resource: "payments", action: "read" },
];

/**
 * Admin permissions (full access)
 */
const adminPermissions: Permission[] = [
  { resource: "appointments", action: "manage" },
  { resource: "patients", action: "manage" },
  { resource: "doctors", action: "manage" },
  { resource: "prescriptions", action: "manage" },
  { resource: "payments", action: "manage" },
  { resource: "users", action: "manage" },
  { resource: "settings", action: "manage" },
  { resource: "applications", action: "manage" },
  { resource: "applications", action: "approve" },
  { resource: "applications", action: "reject" },
  { resource: "verifications", action: "manage" },
  { resource: "verifications", action: "approve" },
  { resource: "verifications", action: "reject" },
];

/**
 * Role permissions mapping
 */
export const rolePermissions: RolePermissions = {
  patient: patientPermissions,
  doctor_pending: doctorPendingPermissions,
  doctor: doctorPermissions,
  admin: adminPermissions,
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: "patient" | "doctor_pending" | "doctor" | "admin",
  resource: Permission["resource"],
  action: Permission["action"]
): boolean {
  const permissions = rolePermissions[role];
  return permissions.some(
    (p) => p.resource === resource && p.action === action
  );
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: "patient" | "doctor_pending" | "doctor" | "admin"): Permission[] {
  return rolePermissions[role];
}
