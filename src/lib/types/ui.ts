/**
 * UI Component Types
 * All UI component prop interfaces
 */

import React from "react";

/**
 * DataTable component props
 */
export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
}

/**
 * DataTable column definition
 */
export interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

/**
 * PageHeader component props
 */
export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * FormFieldEnhanced component props
 */
export interface FormFieldEnhancedProps {
  label: string | React.ReactNode;
  required?: boolean;
  description?: string;
  error?: any; // FieldError from react-hook-form
  touched?: boolean;
  isValid?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * EmptyState component props
 */
export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

/**
 * FileUpload component props
 */
export interface FileUploadProps {
  onUploadComplete?: (url: string, publicId: string) => void;
  onUploadError?: (error: Error) => void;
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  accept?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * StatCard component props
 */
export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  href?: string;
  className?: string;
}

/**
 * ConfirmDialog component props
 */
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  warningText?: string;
}

/**
 * AddDoctorDialog component props
 */
export interface AddDoctorDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * EditDoctorDialog component props
 */
export interface EditDoctorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: {
    id: string;
    name: string;
    email: string;
    phone: string;
    speciality: string;
    gender: string;
  } | null;
}

/**
 * AppointmentConfirmationModal component props
 */
export interface AppointmentConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentDetails: {
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
    userEmail: string;
  };
}

/**
 * ViewDoctorDocumentsDialog component props
 */
export interface ViewDoctorDocumentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: string;
  doctorName: string;
}

/**
 * ViewMyDocumentsDialog component props
 * Note: This component uses isOpen/onClose pattern instead of open/onOpenChange
 */
export interface ViewMyDocumentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: string;
}

