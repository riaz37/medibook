/**
 * Users Service
 * Handles all user-related business logic
 * Note: Server-side sync should use syncUserDirect from @/lib/server/users
 */

import { apiClient } from "./api-client.service";
import { BaseService, ApiException } from "./base.service";
import { AuthService } from "./auth.service";
import type { User } from "@/lib/types";

class UsersService extends BaseService {
  /**
   * Sync user from Clerk to database
   * Server-side only - uses direct database access via syncUserDirect
   * For client-side, use syncUserClient()
   */
  async syncUser(): Promise<User | null> {
    // In server components, import syncUserDirect from @/lib/server/users directly
    // This method is kept for backward compatibility but should use syncUserDirect in server components
    if (typeof window === "undefined") {
      // Server-side: dynamically import to avoid bundling server code in client
      const { syncUserDirect } = await import("@/lib/server/users");
      return syncUserDirect();
    }
    // Client-side fallback (shouldn't happen, but handle gracefully)
    return this.syncUserClient();
  }

  /**
   * Sync user from client-side
   */
  async syncUserClient(): Promise<User | null> {
    try {
      return (await apiClient.syncUser()) as User;
    } catch (error) {
      console.error("Error syncing user:", error);
      return null;
    }
  }

  /**
   * Get current user from auth (server-side)
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const clerkUser = await AuthService.getCurrentUser();
      if (!clerkUser) {
        return null;
      }

      // In a real app, you might want to fetch from your database
      // For now, we'll return the synced user
      return await this.syncUser();
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  /**
   * Select user role
   */
  async selectRole(role: "PATIENT" | "DOCTOR" | "ADMIN"): Promise<User> {
    try {
      if (!role) {
        throw new ApiException("Role is required");
      }
      return (await apiClient.selectUserRole(role)) as User;
    } catch (error) {
      throw this.handleError(error, "Failed to select role");
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

