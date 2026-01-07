/**
 * Doctors Service
 * Handles all doctor-related business logic
 */

import { apiClient } from "./api-client.service";
import { BaseService, ApiException } from "./base.service";
import type {
  Doctor,
  CreateDoctorInput,
  UpdateDoctorInput,
} from "@/lib/types";

class DoctorsService extends BaseService {
  /**
   * Get all doctors
   */
  async getAll(): Promise<Doctor[]> {
    try {
      return (await apiClient.getDoctors()) as Doctor[];
    } catch (error) {
      throw this.handleError(error, "Failed to fetch doctors");
    }
  }

  /**
   * Get all doctors for admin (includes unverified)
   */
  async getAllForAdmin(): Promise<Doctor[]> {
    try {
      return (await apiClient.getAllDoctorsForAdmin()) as Doctor[];
    } catch (error) {
      throw this.handleError(error, "Failed to fetch doctors");
    }
  }

  /**
   * Get available (active) doctors
   */
  async getAvailable(): Promise<Doctor[]> {
    try {
      return (await apiClient.getAvailableDoctors()) as Doctor[];
    } catch (error) {
      throw this.handleError(error, "Failed to fetch available doctors");
    }
  }

  /**
   * Get doctor by ID
   */
  async getById(id: string): Promise<Doctor> {
    try {
      if (!id) {
        throw new ApiException("Doctor ID is required");
      }
      return (await apiClient.getDoctorById(id)) as Doctor;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch doctor");
    }
  }

  /**
   * Create a new doctor
   */
  async create(input: CreateDoctorInput): Promise<Doctor> {
    try {
      this.validateCreateInput(input);
      return (await apiClient.createDoctor(input)) as Doctor;
    } catch (error) {
      throw this.handleError(error, "Failed to create doctor");
    }
  }

  /**
   * Update an existing doctor
   */
  async update(input: UpdateDoctorInput): Promise<Doctor> {
    try {
      this.validateUpdateInput(input);
      const { id, ...data } = input;
      return (await apiClient.updateDoctor(id, data)) as Doctor;
    } catch (error) {
      throw this.handleError(error, "Failed to update doctor");
    }
  }

  /**
   * Delete a doctor
   */
  async deleteDoctor(id: string): Promise<void> {
    try {
      if (!id) {
        throw new ApiException("Doctor ID is required");
      }
      await apiClient.deleteDoctor(id);
    } catch (error) {
      throw this.handleError(error, "Failed to delete doctor");
    }
  }

  /**
   * Get doctor verification documents
   */
  async getVerification(doctorId: string) {
    try {
      if (!doctorId) {
        throw new ApiException("Doctor ID is required");
      }
      return await apiClient.getDoctorVerification(doctorId);
    } catch (error) {
      throw this.handleError(error, "Failed to fetch verification documents");
    }
  }

  /**
   * Submit doctor verification documents
   */
  async submitVerification(doctorId: string, data: {
    licenseUrl?: string;
    certificateUrl?: string;
    idDocumentUrl?: string;
    otherDocuments?: string;
  }) {
    try {
      if (!doctorId) {
        throw new ApiException("Doctor ID is required");
      }
      if (!data.licenseUrl) {
        throw new ApiException("Medical license is required");
      }
      return await apiClient.submitDoctorVerification(doctorId, data);
    } catch (error) {
      throw this.handleError(error, "Failed to submit verification documents");
    }
  }

  /**
   * Get doctor configuration
   */
  async getConfig(doctorId: string) {
    try {
      if (!doctorId) {
        throw new ApiException("Doctor ID is required");
      }
      return await apiClient.getDoctorConfig(doctorId);
    } catch (error) {
      throw this.handleError(error, "Failed to fetch doctor configuration");
    }
  }

  /**
   * Update doctor configuration
   */
  async updateConfig(doctorId: string, data: {
    slotDuration?: number;
    bookingAdvanceDays?: number;
    minBookingHours?: number;
    timeSlots?: string[];
  }) {
    try {
      if (!doctorId) {
        throw new ApiException("Doctor ID is required");
      }
      return await apiClient.updateDoctorConfig(doctorId, data);
    } catch (error) {
      throw this.handleError(error, "Failed to update doctor configuration");
    }
  }

  /**
   * Get doctor working hours
   */
  async getWorkingHours(doctorId: string) {
    try {
      if (!doctorId) {
        throw new ApiException("Doctor ID is required");
      }
      return await apiClient.getDoctorWorkingHours(doctorId);
    } catch (error) {
      throw this.handleError(error, "Failed to fetch working hours");
    }
  }

  /**
   * Update doctor working hours
   */
  async updateWorkingHours(doctorId: string, data: Array<{
    dayOfWeek: number;
    startTime?: string | null;
    endTime?: string | null;
    isWorking: boolean;
  }>) {
    try {
      if (!doctorId) {
        throw new ApiException("Doctor ID is required");
      }
      return await apiClient.updateDoctorWorkingHours(doctorId, data);
    } catch (error) {
      throw this.handleError(error, "Failed to update working hours");
    }
  }

  /**
   * Get doctor appointment types
   */
  async getAppointmentTypes(doctorId: string) {
    try {
      if (!doctorId) {
        throw new ApiException("Doctor ID is required");
      }
      return await apiClient.getDoctorAppointmentTypes(doctorId);
    } catch (error) {
      throw this.handleError(error, "Failed to fetch appointment types");
    }
  }

  /**
   * Create doctor appointment type
   */
  async createAppointmentType(doctorId: string, data: {
    name: string;
    duration: number;
    description?: string;
    price?: number;
  }) {
    try {
      if (!doctorId) {
        throw new ApiException("Doctor ID is required");
      }
      if (!data.name || !data.duration) {
        throw new ApiException("Name and duration are required");
      }
      return await apiClient.createDoctorAppointmentType(doctorId, data);
    } catch (error) {
      throw this.handleError(error, "Failed to create appointment type");
    }
  }

  /**
   * Update doctor appointment type
   */
  async updateAppointmentType(doctorId: string, typeId: string, data: {
    name?: string;
    duration?: number;
    description?: string;
    price?: number;
    isActive?: boolean;
  }) {
    try {
      if (!doctorId || !typeId) {
        throw new ApiException("Doctor ID and Type ID are required");
      }
      return await apiClient.updateDoctorAppointmentType(doctorId, typeId, data);
    } catch (error) {
      throw this.handleError(error, "Failed to update appointment type");
    }
  }

  /**
   * Delete doctor appointment type
   */
  async deleteAppointmentType(doctorId: string, typeId: string) {
    try {
      if (!doctorId || !typeId) {
        throw new ApiException("Doctor ID and Type ID are required");
      }
      return await apiClient.deleteDoctorAppointmentType(doctorId, typeId);
    } catch (error) {
      throw this.handleError(error, "Failed to delete appointment type");
    }
  }

  /**
   * Get doctor available slots for a date
   * @param doctorId - Doctor ID
   * @param date - Date in YYYY-MM-DD format
   * @param duration - Optional appointment duration in minutes. If provided, only returns slots that can accommodate this duration.
   */
  async getAvailableSlots(doctorId: string, date: string, duration?: number) {
    try {
      if (!doctorId || !date) {
        throw new ApiException("Doctor ID and date are required");
      }
      return await apiClient.getDoctorAvailableSlots(doctorId, date, duration);
    } catch (error) {
      throw this.handleError(error, "Failed to fetch available slots");
    }
  }

  /**
   * Validate create input
   */
  private validateCreateInput(input: CreateDoctorInput): void {
    if (!input.name || !input.email) {
      throw new ApiException("Name and email are required");
    }
    if (!input.phone) {
      throw new ApiException("Phone number is required");
    }
    if (!input.speciality) {
      throw new ApiException("Speciality is required");
    }
  }

  /**
   * Validate update input
   */
  private validateUpdateInput(input: UpdateDoctorInput): void {
    if (!input.id) {
      throw new ApiException("Doctor ID is required");
    }
    if (input.name !== undefined && !input.name) {
      throw new ApiException("Name cannot be empty");
    }
    if (input.email !== undefined && !input.email) {
      throw new ApiException("Email cannot be empty");
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
export const doctorsService = new DoctorsService();

