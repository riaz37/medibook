/**
 * Payment and Billing Types
 * All payment-related interfaces and types
 */

/**
 * Payment information for patient payments view
 */
export interface Payment {
  id: string;
  appointmentPrice: number;
  patientPaid: boolean;
  patientPaidAt: string | null;
  status: string;
  refunded: boolean;
  refundAmount: number | null;
  createdAt: string;
  appointment: {
    id: string;
    date: string;
    time: string;
    status: string;
    reason: string | null;
    appointmentType: {
      name: string;
      price: number;
    } | null;
    doctor: {
      name: string;
      speciality: string;
      imageUrl: string | null;
    };
  } | null;
}

/**
 * Billing data structure for doctor billing view
 */
export interface BillingData {
  doctorId: string;
  period: {
    month: number;
    year: number;
    start: string;
    end: string;
  };
  totals: {
    totalAppointments: number;
    completedAppointments: number;
    grossRevenue: number;
    totalCommission: number;
    totalPayouts: number;
    totalRefunds: number;
  };
  entries: Array<{
    paymentId: string;
    appointmentId: string;
    appointmentDate: string | null;
    appointmentTime: string | null;
    appointmentStatus: string | null;
    patientName: string | null;
    appointmentPrice: number;
    commissionAmount: number;
    doctorPayoutAmount: number;
    patientPaid: boolean;
    doctorPaid: boolean;
    status: string;
    refunded: boolean;
    refundAmount: number | null;
    createdAt: string;
  }>;
}

