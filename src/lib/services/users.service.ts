/**
 * Users Service
 * Handles all user-related business logic
 */

import { apiClient } from "./api-client.service";
import { BaseService, ApiException } from "./base.service";
import type { User } from "@/lib/types";

class UsersService extends BaseService {

  /**
   * Get current user from auth (server-side)
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const me = await apiClient.getMe();
      return (me as any)?.user || null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<User | null> {
    try {
      return (await apiClient.getUserProfile()) as User;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
  }): Promise<User> {
    try {
      return (await apiClient.updateUserProfile(data)) as User;
    } catch (error) {
      throw this.handleError(error, "Failed to update profile");
    }
  }

  /**
   * Select role (for new users during signup)
   */
  async selectRole(role: "PATIENT" | "DOCTOR" | "ADMIN"): Promise<User> {
    try {
      return (await apiClient.setSignupIntent({ role })) as User;
    } catch (error) {
      throw this.handleError(error, "Failed to select role");
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
export const usersService = new UsersService();
