/**
 * Centralized Types
 * All shared types and interfaces for the application
 */

// ============================================================================
// Enums (defined locally to avoid importing Prisma Client in client bundle)
// ============================================================================

/**
 * Gender enum - defined locally to avoid Prisma Client in client bundle
 * Must match the enum in prisma/schema.prisma
 */
export type Gender = "MALE" | "FEMALE";

/**
 * UserRole type - defined locally to avoid importing Prisma Client in client bundle
 * Must match the enum in prisma/schema.prisma
 */
export type UserRoleType = "PATIENT" | "DOCTOR" | "ADMIN";

/**
 * UserRole enum values - for use as object properties
 * This allows both type checking and runtime access (e.g., UserRole.PATIENT)
 */
export const UserRole = {
  PATIENT: "PATIENT" as const,
  DOCTOR: "DOCTOR" as const,
  ADMIN: "ADMIN" as const,
} as const;

// Export type alias for convenience
export type UserRole = UserRoleType;


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
  payment?: {
    id: string;
    appointmentPrice: number | string;
    commissionAmount: number | string;
    doctorPayoutAmount: number | string;
    status: string;
    patientPaid: boolean;
    doctorPaid: boolean;
    refunded?: boolean;
    refundAmount?: number | string | null;
    patientPaidAt?: Date | string | null;
  } | null;
  prescription?: {
    id: string;
    status: string;
    issueDate?: Date | string;
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
  role?: UserRole;
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
  details?: Array<{ field: string; message: string }>;
  code?: string;
  status?: number;
  message?: string; // For backward compatibility
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
// Note: Gender is defined locally above to avoid Prisma Client in client bundle
// Server-side code can still import from @/generated/prisma/client if needed
// ============================================================================

// ============================================================================
// Verification Types
// ============================================================================

export type {
  DoctorVerification,
  VerificationWithDoctor,
  VerificationStatus,
} from "./verification";

// ============================================================================
// Doctor Configuration Types
// ============================================================================

export type {
  DoctorAvailability,
  DoctorWorkingHour,
  DoctorAppointmentType,
  DoctorConfig,
} from "./doctor-config";

// ============================================================================
// Payment Types
// ============================================================================

export type {
  Payment,
  BillingData,
} from "./payments";

// ============================================================================
// Appointment Component Types
// ============================================================================

export type {
  DashboardAppointment,
  NextAppointmentData,
  DoctorAppointmentListItem,
  UpcomingAppointmentData,
} from "./appointments";

// ============================================================================
// Analytics Types
// ============================================================================

export type {
  DoctorAnalyticsClientProps,
  AdminRevenueData,
  AdminRevenueTrendsData,
} from "./analytics";

// ============================================================================
// UI Component Types
// ============================================================================

export type {
  DataTableProps,
  Column,
  PageHeaderProps,
  FormFieldEnhancedProps,
  EmptyStateProps,
  FileUploadProps,
  StatCardProps,
  ConfirmDialogProps,
  AddDoctorDialogProps,
  EditDoctorDialogProps,
  AppointmentConfirmationModalProps,
  ViewDoctorDocumentsDialogProps,
  ViewMyDocumentsDialogProps,
} from "./ui";

// ============================================================================
// Form Types
// ============================================================================

export type {
  TimeSelectionStepProps,
  DoctorSelectionStepProps,
  PaymentStepProps,
  PaymentCheckoutProps,
  BookingConfirmationStepProps,
} from "./forms";

// ============================================================================
// Settings Types
// ============================================================================

export type {
  DoctorSettingsData,
  DoctorVerificationData,
  DoctorSettingsClientProps,
  AppointmentTypesSettingsProps,
  WorkingHoursSettingsProps,
  AvailabilitySettingsProps,
  PaymentSettingsClientProps,
} from "./settings";

// ============================================================================
// Dashboard Types
// ============================================================================

export type {
  TourStep,
  OnboardingTourProps,
  OptimisticUpdateProps,
  ErrorToastOptions,
  NotificationCenterProps,
  CommissionPreviewProps,
  PaymentHistoryProps,
  PaymentAccountStatusProps,
  QuickSettingsProps,
  AppointmentSearchProps,
  AdminStatsProps,
  PatientDashboardLayoutProps,
  DoctorDashboardLayoutProps,
  AdminDashboardLayoutProps,
  DoctorDashboardClientProps,
} from "./dashboard";

