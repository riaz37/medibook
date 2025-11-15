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
      return await apiClient.getDoctors();
    } catch (error) {
      throw this.handleError(error, "Failed to fetch doctors");
    }
  }

  /**
   * Get all doctors for admin (includes unverified)
   */
  async getAllForAdmin(): Promise<Doctor[]> {
    try {
      return await apiClient.getAllDoctorsForAdmin();
    } catch (error) {
      throw this.handleError(error, "Failed to fetch doctors");
    }
  }

  /**
   * Get available (active) doctors
   */
  async getAvailable(): Promise<Doctor[]> {
    try {
      return await apiClient.getAvailableDoctors();
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
      return await apiClient.getDoctorById(id);
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
      return await apiClient.createDoctor(input);
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
      return await apiClient.updateDoctor(id, data);
    } catch (error) {
      throw this.handleError(error, "Failed to update doctor");
    }
  }

  /**
   * Delete a doctor
   */
  async delete(id: string): Promise<void> {
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

