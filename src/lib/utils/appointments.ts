/**
 * Appointment utility functions
 * Shared functions for appointment-related calculations
 */

import prisma from "@/lib/prisma";
import { isAfter, isSameDay } from "date-fns";

/**
 * Get the count of upcoming appointments for a user
 * @param userId - The database user ID
 * @returns The count of upcoming appointments (CONFIRMED or PENDING)
 */
export async function getUpcomingAppointmentCount(userId: string): Promise<number> {
  try {
    const today = new Date();
    const appointments = await prisma.appointment.findMany({
      where: { userId },
      select: { date: true, status: true },
    });

    return appointments.filter((appointment) => {
      const appointmentDate = appointment.date;
      const isUpcoming = isSameDay(appointmentDate, today) || isAfter(appointmentDate, today);
      return isUpcoming && (appointment.status === "CONFIRMED" || appointment.status === "PENDING");
    }).length;
  } catch {
    return 0;
  }
}

/**
 * Get doctor appointment statistics
 * @param doctorId - The database doctor ID
 * @returns Object with total, pending, upcoming, and completed appointment counts
 */
export async function getDoctorStats(doctorId: string): Promise<{
  total: number;
  pending: number;
  upcoming: number;
  completed: number;
}> {
  try {
    const today = new Date();
    const appointments = await prisma.appointment.findMany({
      where: { doctorId },
      select: { date: true, status: true },
    });

    const total = appointments.length;
    const pending = appointments.filter((apt) => apt.status === "PENDING").length;
    const upcoming = appointments.filter((appointment) => {
      const appointmentDate = appointment.date;
      const isUpcoming = isSameDay(appointmentDate, today) || isAfter(appointmentDate, today);
      return isUpcoming && (appointment.status === "CONFIRMED" || appointment.status === "PENDING");
    }).length;
    const completed = appointments.filter((apt) => apt.status === "COMPLETED").length;

    return { total, pending, upcoming, completed };
  } catch {
    return { total: 0, pending: 0, upcoming: 0, completed: 0 };
  }
}

