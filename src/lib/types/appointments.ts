/**
 * Appointment Types
 * Extended appointment interfaces used in components
 */

/**
 * Appointment type used in patient dashboard components
 */
export interface DashboardAppointment {
  id: string;
  date: string;
  time: string;
  status: string;
  reason?: string;
  doctorName: string;
  doctorImageUrl?: string;
}

/**
 * Appointment type used in patient NextAppointment component
 */
export interface NextAppointmentData extends DashboardAppointment {
  patientName: string;
  patientEmail: string;
}

/**
 * Appointment type used in doctor appointments page
 */
export interface DoctorAppointmentListItem {
  id: string;
  date: string;
  time: string;
  status: string;
  reason?: string;
  notes?: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
}

/**
 * Appointment type used in doctor dashboard UpcomingAppointments
 */
export interface UpcomingAppointmentData {
  id: string;
  date: Date;
  time: string;
  status: string;
  reason?: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
}

/**
 * Response type for bulk cancellation API
 */
export interface BulkCancelResponse {
  cancelledCount: number;
  failedCount: number;
  message?: string;
}
