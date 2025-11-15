/**
 * Client-safe Authentication Service
 * For server-side auth, use functions from @/lib/server/auth
 */

import { useUser } from "@clerk/nextjs";
import type { AuthUser } from "@/lib/types";

/**
 * Legacy AuthService - kept for backward compatibility
 * For server-side operations, use functions from @/lib/server/auth
 * @deprecated Use functions from @/lib/server/auth for server-side, useAuth hook for client-side
 */
export class AuthService {
  /**
   * Get current authenticated user (server-side)
   * @deprecated Use getCurrentUser() from @/lib/server/auth
   */
  static async getCurrentUser() {
    if (typeof window !== "undefined") {
      throw new Error("AuthService.getCurrentUser() cannot be used in client components. Use useAuth() hook instead.");
    }
    // Dynamic import to avoid bundling server code
    const { getCurrentUser } = await import("@/lib/server/auth");
    return getCurrentUser();
  }

  /**
   * Get auth object (server-side)
   * @deprecated Use getAuth() from @/lib/server/auth
   */
  static async getAuth() {
    if (typeof window !== "undefined") {
      throw new Error("AuthService.getAuth() cannot be used in client components.");
    }
    const { getAuth } = await import("@/lib/server/auth");
    return getAuth();
  }

  /**
   * Check if user is authenticated (server-side)
   * @deprecated Use isAuthenticated() from @/lib/server/auth
   */
  static async isAuthenticated(): Promise<boolean> {
    if (typeof window !== "undefined") {
      throw new Error("AuthService.isAuthenticated() cannot be used in client components. Use useAuth() hook instead.");
    }
    const { isAuthenticated } = await import("@/lib/server/auth");
    return isAuthenticated();
  }

  /**
   * Get user ID from auth (server-side)
   * @deprecated Use getUserId() from @/lib/server/auth
   */
  static async getUserId(): Promise<string | null> {
    if (typeof window !== "undefined") {
      throw new Error("AuthService.getUserId() cannot be used in client components. Use useAuth() hook instead.");
    }
    const { getUserId } = await import("@/lib/server/auth");
    return getUserId();
  }

  /**
   * Check if user has a specific permission/plan (server-side)
   * @deprecated Use hasPermission() from @/lib/server/auth
   */
  static async hasPermission(params: { permission: string } | { role: string } | { plan: string }): Promise<boolean> {
    if (typeof window !== "undefined") {
      throw new Error("AuthService.hasPermission() cannot be used in client components.");
    }
    const { hasPermission } = await import("@/lib/server/auth");
    return hasPermission(params);
  }
}

/**
 * Client-side authentication hooks
 */
export function useAuth() {
  const { user, isSignedIn, isLoaded } = useUser();

  return {
    user,
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    userId: user?.id,
    email: user?.emailAddresses[0]?.emailAddress,
    firstName: user?.firstName,
    lastName: user?.lastName,
  };
}

