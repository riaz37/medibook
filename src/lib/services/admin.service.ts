/**
 * Admin Service
 * Handles all admin-related business logic
 */

import { apiClient } from "./api-client.service";
import { BaseService, ApiException } from "./base.service";

class AdminService extends BaseService {
  /**
   * Get all doctor verifications (with optional status filter)
   */
  async getDoctorVerifications(status?: "PENDING" | "APPROVED" | "REJECTED") {
    try {
      return await apiClient.getAdminDoctorVerifications(status);
    } catch (error) {
      throw this.handleError(error, "Failed to fetch doctor verifications");
    }
  }

  /**
   * Update doctor verification status
   */
  async updateVerificationStatus(verificationId: string, data: {
    status: "APPROVED" | "REJECTED";
    rejectionReason?: string;
  }) {
    try {
      if (!verificationId) {
        throw new ApiException("Verification ID is required");
      }
      if (!data.status) {
        throw new ApiException("Status is required");
      }
      if (data.status === "REJECTED" && !data.rejectionReason) {
        throw new ApiException("Rejection reason is required when rejecting");
      }
      return await apiClient.updateDoctorVerificationStatus(verificationId, data);
    } catch (error) {
      throw this.handleError(error, "Failed to update verification status");
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
export const adminService = new AdminService();

