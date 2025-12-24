"use client";

import AppointmentsList, { AppointmentFilter, AppointmentsListProps } from "./AppointmentsList";

/**
 * My Appointments Tab Component
 * 
 * Wrapper around AppointmentsList to provide a clear component name
 * for use within the unified appointments page tab system.
 */
export default function MyAppointmentsTab(props: AppointmentsListProps) {
  return <AppointmentsList {...props} />;
}

// Re-export types for convenience
export type { AppointmentFilter, AppointmentsListProps };

