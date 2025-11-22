/**
 * Analytics Types
 * Types for analytics and dashboard data
 */

/**
 * Props for DoctorAnalyticsClient component
 */
export interface DoctorAnalyticsClientProps {
  doctorId: string;
}

/**
 * Admin revenue data structure (when period is not provided)
 */
export interface AdminRevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  totalAppointments: number;
  recentPayments: Array<{
    id: string;
    createdAt: string;
    appointmentPrice: number;
    commissionAmount: number;
    status: string;
    patientPaid?: number | null;
    doctor: {
      id: string;
      name: string;
    } | null;
    appointment: {
      id: string;
      appointmentType: {
        id: string;
        name: string;
      } | null;
    } | null;
  }>;
}

/**
 * Admin revenue trends data structure (when period is provided)
 */
export interface AdminRevenueTrendsData {
  period: number;
  data: Array<{
    date: string;
    revenue: number;
    commission: number;
  }>;
}

