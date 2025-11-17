/**
 * Doctor Configuration Types
 */

export interface DoctorAvailability {
  slotDuration: number;
  bookingAdvanceDays: number;
  minBookingHours: number;
  timeSlots: string[];
}

export interface DoctorWorkingHour {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorking: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorAppointmentType {
  id: string;
  doctorId: string;
  name: string;
  duration: number;
  description: string | null;
  price: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorConfig {
  availability: DoctorAvailability;
  workingHours: DoctorWorkingHour[];
  appointmentTypes: DoctorAppointmentType[];
}


