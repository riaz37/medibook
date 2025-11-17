/**
 * Appointments Service
 * Handles all appointment-related business logic
 */

import { apiClient } from "./api-client.service";
import { BaseService, ApiException } from "./base.service";
import type {
  Appointment,
  BookAppointmentInput,
  UpdateAppointmentStatusInput,
  AppointmentStats,
  RescheduleAppointmentInput,
  CancelAppointmentInput,
} from "@/lib/types";

class AppointmentsService extends BaseService {
  /**
   * Get all appointments (admin)
   */
  async getAll(): Promise<Appointment[]> {
    try {
      return (await apiClient.getAppointments()) as Appointment[];
    } catch (error) {
      throw this.handleError(error, "Failed to fetch appointments");
    }
  }

  /**
   * Get doctor appointments
   */
  async getDoctorAppointments(doctorId?: string): Promise<Appointment[]> {
    try {
      return (await apiClient.getDoctorAppointments(doctorId)) as Appointment[];
    } catch (error) {
      throw this.handleError(error, "Failed to fetch doctor appointments");
    }
  }

  /**
   * Get user's appointments
   */
  async getUserAppointments(userId?: string): Promise<Appointment[]> {
    try {
      return (await apiClient.getUserAppointments(userId)) as Appointment[];
    } catch (error) {
      throw this.handleError(error, "Failed to fetch user appointments");
    }
  }

  /**
   * Get appointment by ID
   */
  async getById(id: string): Promise<Appointment> {
    try {
      if (!id) {
        throw new ApiException("Appointment ID is required");
      }
      return (await apiClient.getAppointmentById(id)) as Appointment;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch appointment");
    }
  }

  /**
   * Book a new appointment
   */
  async book(input: BookAppointmentInput): Promise<Appointment> {
    try {
      this.validateBookInput(input);
      return (await apiClient.bookAppointment(input)) as Appointment;
    } catch (error) {
      throw this.handleError(error, "Failed to book appointment");
    }
  }

  /**
   * Update appointment status
   */
  async updateStatus(input: UpdateAppointmentStatusInput): Promise<Appointment> {
    try {
      this.validateUpdateStatusInput(input);
      return (await apiClient.updateAppointmentStatus(input.id, input.status)) as Appointment;
    } catch (error) {
      throw this.handleError(error, "Failed to update appointment status");
    }
  }

  /**
   * Get booked time slots for a doctor on a specific date
   */
  async getBookedTimeSlots(doctorId: string, date: string): Promise<string[]> {
    try {
      if (!doctorId || !date) {
        throw new ApiException("Doctor ID and date are required");
      }
      return (await apiClient.getBookedTimeSlots(doctorId, date)) as string[];
    } catch (error) {
      throw this.handleError(error, "Failed to fetch booked time slots");
    }
  }

  /**
   * Get user appointment statistics
   */
  async getStats(): Promise<AppointmentStats> {
    try {
      return (await apiClient.getAppointmentStats()) as AppointmentStats;
    } catch (error) {
      // Return default stats on error
      return {
        totalAppointments: 0,
        completedAppointments: 0,
      };
    }
  }

  /**
   * Reschedule an appointment
   */
  async reschedule(input: RescheduleAppointmentInput): Promise<Appointment> {
    try {
      this.validateRescheduleInput(input);
      return (await apiClient.rescheduleAppointment(input.id, input.date, input.time)) as Appointment;
    } catch (error) {
      throw this.handleError(error, "Failed to reschedule appointment");
    }
  }

  /**
   * Cancel an appointment
   */
  async cancel(input: CancelAppointmentInput): Promise<Appointment> {
    try {
      this.validateCancelInput(input);
      return (await apiClient.cancelAppointment(input.id, input.reason)) as Appointment;
    } catch (error) {
      throw this.handleError(error, "Failed to cancel appointment");
    }
  }

  /**
   * Export appointment as ICS calendar file
   */
  async exportToICS(id: string): Promise<Blob> {
    try {
      if (!id) {
        throw new ApiException("Appointment ID is required");
      }
      return await apiClient.exportAppointmentToICS(id);
    } catch (error) {
      throw this.handleError(error, "Failed to export appointment");
    }
  }

  /**
   * Validate book input
   */
  private validateBookInput(input: BookAppointmentInput): void {
    if (!input.doctorId) {
      throw new ApiException("Doctor ID is required");
    }
    if (!input.date) {
      throw new ApiException("Date is required");
    }
    if (!input.time) {
      throw new ApiException("Time is required");
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input.date)) {
      throw new ApiException("Date must be in YYYY-MM-DD format");
    }

    // Validate time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(input.time)) {
      throw new ApiException("Time must be in HH:MM format (24-hour)");
    }
  }

  /**
   * Validate update status input
   */
  private validateUpdateStatusInput(input: UpdateAppointmentStatusInput): void {
    if (!input.id) {
      throw new ApiException("Appointment ID is required");
    }
    if (!input.status) {
      throw new ApiException("Status is required");
    }
  }

  /**
   * Validate reschedule input
   */
  private validateRescheduleInput(input: RescheduleAppointmentInput): void {
    if (!input.id) {
      throw new ApiException("Appointment ID is required");
    }
    if (!input.date) {
      throw new ApiException("Date is required");
    }
    if (!input.time) {
      throw new ApiException("Time is required");
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input.date)) {
      throw new ApiException("Date must be in YYYY-MM-DD format");
    }

    // Validate time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(input.time)) {
      throw new ApiException("Time must be in HH:MM format (24-hour)");
    }
  }

  /**
   * Validate cancel input
   */
  private validateCancelInput(input: CancelAppointmentInput): void {
    if (!input.id) {
      throw new ApiException("Appointment ID is required");
    }
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown, defaultMessage: string): ApiException {
    if (error instanceof ApiException) {
      return error;
    }
    return new ApiException(
      error instanceof Error ? error.message : defaultMessage,
      undefined,
      error
    );
  }
}

// Export singleton instance
export const appointmentsService = new AppointmentsService();

