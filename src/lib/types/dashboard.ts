/**
 * Dashboard Types
 * Types specific to dashboard components and layouts
 */

import React from "react";

/**
 * OnboardingTour step definition
 */
export interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: "top" | "bottom" | "left" | "right" | "center";
}

/**
 * OnboardingTour component props
 */
export interface OnboardingTourProps {
  tourId: string;
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
}

/**
 * OptimisticUpdate component props
 */
export interface OptimisticUpdateProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showSpinner?: boolean;
}

/**
 * ErrorToast options
 */
export interface ErrorToastOptions {
  message: string;
  retry?: () => void;
  dismiss?: () => void;
  duration?: number;
}

/**
 * NotificationCenter component props
 */
export interface NotificationCenterProps {
  userId?: string;
}

/**
 * CommissionPreview component props
 */
export interface CommissionPreviewProps {
  appointmentPrice: number | null;
  className?: string;
}

/**
 * PaymentHistory component props
 */
export interface PaymentHistoryProps {
  doctorId: string;
}

/**
 * PaymentAccountStatus component props
 */
export interface PaymentAccountStatusProps {
  doctorId: string;
}

/**
 * QuickSettings component props
 */
export interface QuickSettingsProps {
  doctor: {
    id: string;
    [key: string]: any;
  } | null;
}

/**
 * AppointmentSearch component props
 */
export interface AppointmentSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * AdminStats component props
 */
export interface AdminStatsProps {
  totalDoctors: number;
  activeDoctors: number;
  totalAppointments: number;
  completedAppointments: number;
}

/**
 * PatientDashboardLayout component props
 */
export interface PatientDashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * DoctorDashboardLayout component props
 */
export interface DoctorDashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * DoctorDashboardClient component props
 */
export interface DoctorDashboardClientProps {
  doctor: {
    id: string;
    [key: string]: any;
  } | null;
  appointments: Array<{
    id: string;
    [key: string]: any;
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
      phone: string | null;
    };
  }>;
  stats: {
    total: number;
    upcoming: number;
    completed: number;
  };
}

/**
 * AdminDashboardLayout component props
 */
export interface AdminDashboardLayoutProps {
  children: React.ReactNode;
}

