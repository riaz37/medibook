/**
 * Application Configuration
 * Centralized configuration management
 */

export const AppConfig = {
  // Appointment Settings
  appointment: {
    defaultDuration: parseInt(process.env.NEXT_PUBLIC_DEFAULT_APPOINTMENT_DURATION || "30"),
    bookingAdvanceDays: parseInt(process.env.NEXT_PUBLIC_BOOKING_ADVANCE_DAYS || "5"),
    defaultStatus: "CONFIRMED" as const,
  },

  // Avatar Settings
  avatar: {
    serviceUrl: process.env.NEXT_PUBLIC_AVATAR_SERVICE_URL || "https://avatar.iran.liara.run/public",
  },

  // Phone Formatting
  phone: {
    defaultFormat: process.env.NEXT_PUBLIC_PHONE_FORMAT || "US",
  },

  // Time Slots (can be overridden per doctor)
  timeSlots: {
    default: [
      "09:00", "09:30", "10:00", "10:30",
      "11:00", "11:30", "14:00", "14:30",
      "15:00", "15:30", "16:00", "16:30",
    ],
  },

  // User Settings
  user: {
    defaultRole: "PATIENT" as const,
  },

  // Doctor Settings
  doctor: {
    defaultSpeciality: process.env.NEXT_PUBLIC_DEFAULT_DOCTOR_SPECIALITY || "General",
  },
} as const;

/**
 * Get available time slots
 * Can be customized per doctor in the future
 */
export function getAvailableTimeSlots(doctorId?: string): string[] {
  // TODO: Fetch doctor-specific time slots from database
  // For now, return default slots
  return [...AppConfig.timeSlots.default];
}

/**
 * Get next N days for booking
 */
export function getNextDays(count?: number): string[] {
  const days = count || AppConfig.appointment.bookingAdvanceDays;
  const dates: string[] = [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (let i = 0; i < days; i++) {
    const date = new Date(tomorrow);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
}

/**
 * Generate avatar URL
 */
export function generateAvatarUrl(name: string, gender: "MALE" | "FEMALE"): string {
  const username = name.replace(/\s+/g, "").toLowerCase();
  const base = AppConfig.avatar.serviceUrl;
  if (gender === "FEMALE") return `${base}/girl?username=${username}`;
  return `${base}/boy?username=${username}`;
}

