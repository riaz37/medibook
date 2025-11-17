/**
 * Centralized Types
 * All shared types and interfaces for the application
 */

import { Gender } from "@prisma/client";

// ============================================================================
// Appointment Types
// ============================================================================

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface Appointment {
  id: string;
  date: string;
  time: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string | null;
  reason?: string | null;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  doctorImageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extended Appointment with relations (used when fetching by ID)
export interface AppointmentWithRelations extends Appointment {
  doctor?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    speciality: string | null;
    imageUrl: string | null;
    bio: string | null;
  };
  appointmentType?: {
    id: string;
    name: string;
    duration: number;
    price: number | null;
    description: string | null;
  } | null;
}

export interface BookAppointmentInput {
  doctorId: string;
  date: string;
  time: string;
  reason?: string;
  userId?: string;
  appointmentTypeId?: string; // Link to doctor's appointment type
}

export interface UpdateAppointmentStatusInput {
  id: string;
  status: AppointmentStatus;
}

export interface AppointmentStats {
  totalAppointments: number;
  completedAppointments: number;
}

export interface RescheduleAppointmentInput {
  id: string;
  date: string;
  time: string;
}

export interface CancelAppointmentInput {
  id: string;
  reason?: string;
}

// ============================================================================
// Doctor Types
// ============================================================================

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  speciality: string;
  bio?: string | null;
  imageUrl: string;
  gender: Gender;
  isVerified: boolean;
  appointmentCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDoctorInput {
  name: string;
  email: string;
  phone: string;
  speciality: string;
  gender: Gender;
}

export interface UpdateDoctorInput extends Partial<CreateDoctorInput> {
  id: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role?: "PATIENT" | "DOCTOR" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

// ============================================================================
// API Types
// ============================================================================

export interface ApiError {
  error: string;
  status?: number;
  message?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// Email Types
// ============================================================================

export interface AppointmentConfirmationEmailData {
  userEmail: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  duration: string;
  price: string;
}

// ============================================================================
// Re-export Prisma types for convenience
// ============================================================================

export type { Gender } from "@prisma/client";

// ============================================================================
// Verification Types
// ============================================================================

export type { DoctorVerification } from "./verification";

// ============================================================================
// Doctor Configuration Types
// ============================================================================

export type {
  DoctorAvailability,
  DoctorWorkingHour,
  DoctorAppointmentType,
  DoctorConfig,
} from "./doctor-config";

