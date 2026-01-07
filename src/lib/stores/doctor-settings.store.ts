import { create } from "zustand";

interface AvailabilityState {
  timeSlots: string[];
  slotDuration: number;
  bookingAdvanceDays: number;
  minBookingHours: number;
}

interface WorkingHour {
  dayOfWeek: number;
  startTime?: string | null;
  endTime?: string | null;
  isWorking: boolean;
}

interface AppointmentType {
  id: string;
  name: string;
  duration: number;
  description: string | null;
  price: number | null;
  isActive: boolean;
}

interface DoctorSettingsState {
  // Availability
  availability: AvailabilityState;
  setAvailability: (availability: Partial<AvailabilityState>) => void;
  resetAvailability: () => void;

  // Working Hours
  workingHours: WorkingHour[];
  setWorkingHours: (hours: WorkingHour[]) => void;
  updateWorkingHour: (dayOfWeek: number, field: keyof WorkingHour, value: any) => void;
  resetWorkingHours: () => void;

  // Appointment Types
  appointmentTypes: AppointmentType[];
  setAppointmentTypes: (types: AppointmentType[]) => void;
  addAppointmentType: (type: AppointmentType) => void;
  updateAppointmentType: (id: string, updates: Partial<AppointmentType>) => void;
  removeAppointmentType: (id: string) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Initialize from API data
  initializeFromConfig: (config: {
    availability?: Partial<AvailabilityState>;
    workingHours?: WorkingHour[];
    appointmentTypes?: AppointmentType[];
  }) => void;
}

const defaultAvailability: AvailabilityState = {
  timeSlots: [],
  slotDuration: 30,
  bookingAdvanceDays: 30,
  minBookingHours: 24,
};

const defaultWorkingHours: WorkingHour[] = [
  { dayOfWeek: 0, startTime: null, endTime: null, isWorking: false }, // Sunday
  { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isWorking: true }, // Monday
  { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isWorking: true }, // Tuesday
  { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isWorking: true }, // Wednesday
  { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isWorking: true }, // Thursday
  { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isWorking: true }, // Friday
  { dayOfWeek: 6, startTime: null, endTime: null, isWorking: false }, // Saturday
];

export const useDoctorSettingsStore = create<DoctorSettingsState>((set) => ({
  // Initial state
  availability: defaultAvailability,
  workingHours: defaultWorkingHours,
  appointmentTypes: [],
  isLoading: false,

  // Availability actions
  setAvailability: (updates) =>
    set((state) => ({
      availability: { ...state.availability, ...updates },
    })),
  resetAvailability: () => set({ availability: defaultAvailability }),

  // Working hours actions
  setWorkingHours: (hours) => set({ workingHours: hours }),
  updateWorkingHour: (dayOfWeek, field, value) =>
    set((state) => ({
      workingHours: state.workingHours.map((wh) =>
        wh.dayOfWeek === dayOfWeek ? { ...wh, [field]: value } : wh
      ),
    })),
  resetWorkingHours: () => set({ workingHours: defaultWorkingHours }),

  // Appointment types actions
  setAppointmentTypes: (types) => set({ appointmentTypes: types }),
  addAppointmentType: (type) =>
    set((state) => ({
      appointmentTypes: [...state.appointmentTypes, type],
    })),
  updateAppointmentType: (id, updates) =>
    set((state) => ({
      appointmentTypes: state.appointmentTypes.map((type) =>
        type.id === id ? { ...type, ...updates } : type
      ),
    })),
  removeAppointmentType: (id) =>
    set((state) => ({
      appointmentTypes: state.appointmentTypes.filter((type) => type.id !== id),
    })),

  // Loading state
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Initialize from API config
  initializeFromConfig: (config) =>
    set({
      availability: config.availability
        ? { ...defaultAvailability, ...config.availability }
        : defaultAvailability,
      workingHours: config.workingHours || defaultWorkingHours,
      appointmentTypes: config.appointmentTypes || [],
    }),
}));

