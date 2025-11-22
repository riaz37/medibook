/**
 * Form Types
 * All form-related component interfaces
 */

/**
 * TimeSelectionStep component props
 */
export interface TimeSelectionStepProps {
  doctorId: string;
  selectedDate: string;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  appointmentTypeId?: string;
}

/**
 * DoctorSelectionStep component props
 */
export interface DoctorSelectionStepProps {
  selectedDentistId: string | null;
  onSelectDentist: (dentistId: string) => void;
  onContinue: () => void;
}

/**
 * PaymentStep component props
 */
export interface PaymentStepProps {
  selectedDentistId: string;
  selectedDate: string;
  selectedTime: string;
  selectedType: string;
  onBack: () => void;
}

/**
 * PaymentCheckout component props
 */
export interface PaymentCheckoutProps {
  appointmentId: string;
  appointmentPrice: number;
  doctorId: string;
  doctorName: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

/**
 * BookingConfirmationStep component props
 */
export interface BookingConfirmationStepProps {
  selectedDentistId: string;
  selectedDate: string;
  selectedTime: string;
  selectedType: string;
  isBooking: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onModify: () => void;
}

