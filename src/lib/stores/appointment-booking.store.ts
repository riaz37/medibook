import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppointmentBookingState {
  // Step 1: Doctor Selection
  selectedDoctorId: string | null;
  setSelectedDoctorId: (doctorId: string | null) => void;

  // Step 2: Time Selection
  selectedDate: string;
  selectedTime: string;
  selectedAppointmentTypeId: string;
  setSelectedDate: (date: string) => void;
  setSelectedTime: (time: string) => void;
  setSelectedAppointmentTypeId: (typeId: string) => void;

  // Step 3: Confirmation
  currentStep: number; // 1: select doctor, 2: select time, 3: confirm
  setCurrentStep: (step: number) => void;

  // Modal state
  showConfirmationModal: boolean;
  setShowConfirmationModal: (show: boolean) => void;
  bookedAppointment: any | null;
  setBookedAppointment: (appointment: any | null) => void;

  // Actions
  resetBooking: () => void;
  resetAfterDoctorChange: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
}

const initialState = {
  selectedDoctorId: null,
  selectedDate: "",
  selectedTime: "",
  selectedAppointmentTypeId: "",
  currentStep: 1,
  showConfirmationModal: false,
  bookedAppointment: null,
};

export const useAppointmentBookingStore = create<AppointmentBookingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Doctor selection
      setSelectedDoctorId: (doctorId) => {
        const currentDoctorId = get().selectedDoctorId;
        set({ selectedDoctorId: doctorId });
        // Reset time selection when doctor changes
        if (doctorId !== currentDoctorId && doctorId !== null) {
          get().resetAfterDoctorChange();
        }
      },

      // Time selection
      setSelectedDate: (date) => set({ selectedDate: date }),
      setSelectedTime: (time) => set({ selectedTime: time }),
      setSelectedAppointmentTypeId: (typeId) => set({ selectedAppointmentTypeId: typeId }),

      // Step navigation
      setCurrentStep: (step) => set({ currentStep: step }),
      goToNextStep: () => {
        const current = get().currentStep;
        if (current < 3) {
          set({ currentStep: current + 1 });
        }
      },
      goToPreviousStep: () => {
        const current = get().currentStep;
        if (current > 1) {
          set({ currentStep: current - 1 });
        }
      },

      // Modal
      setShowConfirmationModal: (show) => set({ showConfirmationModal: show }),
      setBookedAppointment: (appointment) => set({ bookedAppointment: appointment }),

      // Reset actions
      resetBooking: () => set(initialState),
      resetAfterDoctorChange: () =>
        set({
          selectedDate: "",
          selectedTime: "",
          selectedAppointmentTypeId: "",
          currentStep: 1,
        }),
    }),
    {
      name: "appointment-booking-storage",
      // Only persist the booking state, not modal/appointment data
      partialize: (state) => ({
        selectedDoctorId: state.selectedDoctorId,
        selectedDate: state.selectedDate,
        selectedTime: state.selectedTime,
        selectedAppointmentTypeId: state.selectedAppointmentTypeId,
        currentStep: state.currentStep,
      }),
    }
  )
);

