/**
 * Settings Types
 * Types for settings pages and components
 */

import { Gender } from "@prisma/client";

/**
 * Doctor settings data structure
 */
export interface DoctorSettingsData {
  id: string;
  name: string;
  email: string;
  phone: string;
  speciality: string;
  bio: string | null;
  gender: Gender;
  isVerified: boolean;
}

/**
 * Verification data for doctor settings
 */
export interface DoctorVerificationData {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  licenseUrl: string | null;
  certificateUrl: string | null;
  idDocumentUrl: string | null;
  submittedAt: Date | null;
  rejectionReason: string | null;
}

/**
 * DoctorSettingsClient component props
 */
export interface DoctorSettingsClientProps {
  doctor: DoctorSettingsData;
  verification: DoctorVerificationData | null;
}

/**
 * AppointmentTypesSettings component props
 */
export interface AppointmentTypesSettingsProps {
  doctorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * WorkingHoursSettings component props
 */
export interface WorkingHoursSettingsProps {
  doctorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * AvailabilitySettings component props
 */
export interface AvailabilitySettingsProps {
  doctorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * PaymentSettingsClient component props
 */
export interface PaymentSettingsClientProps {
  doctorId: string;
}

