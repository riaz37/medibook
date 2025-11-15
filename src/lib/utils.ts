import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { generateAvatarUrl } from "./config/app.config";

export function generateAvatar(name: string, gender: "MALE" | "FEMALE") {
  return generateAvatarUrl(name, gender);
}

// phone formatting function for US numbers - ai generated 🎉
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

import { getNextDays } from "./config/app.config";

// Re-export for backward compatibility
export const getNext5Days = () => getNextDays(5);

import { getAvailableTimeSlots as getTimeSlots } from "./config/app.config";

// Re-export for backward compatibility
export const getAvailableTimeSlots = () => getTimeSlots();

// Appointment types are now stored in database per doctor
// This is kept for backward compatibility only - will be removed
export const APPOINTMENT_TYPES: never[] = [];
