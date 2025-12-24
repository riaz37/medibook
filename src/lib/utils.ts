import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  generateAvatarUrl, 
  getNextDays, 
  getAvailableTimeSlots as getTimeSlots 
} from "./config/app.config";

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate avatar URL from name and gender
 */
export function generateAvatar(name: string, gender: "MALE" | "FEMALE") {
  return generateAvatarUrl(name, gender);
}

/**
 * Format phone number for US numbers
 */
export const formatPhoneNumber = (value: string) => {
  if (!value) return value;

  const phoneNumber = value.replace(/[^\d]/g, "");
  const phoneNumberLength = phoneNumber.length;

  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

/**
 * Get next 5 days (backward compatibility)
 * @deprecated Use getNextDays(5) directly
 */
export const getNext5Days = () => getNextDays(5);

/**
 * Get available time slots (backward compatibility)
 * @deprecated Use getTimeSlots() directly from app.config
 */
export const getAvailableTimeSlots = () => getTimeSlots();

/**
 * Appointment types are now stored in database per doctor
 * @deprecated This is kept for backward compatibility only - will be removed
 */
export const APPOINTMENT_TYPES: never[] = [];
