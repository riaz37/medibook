"use client";

import { create } from "zustand";
import { useEffect } from "react";

interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  imageUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  setUser: (user: AuthUser | null) => void;
  setIsLoaded: (loaded: boolean) => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoaded: false,
  isSignedIn: false,
  setUser: (user) => set({ user, isSignedIn: !!user }),
  setIsLoaded: (loaded) => set({ isLoaded: loaded }),
  signOut: async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      set({ user: null, isSignedIn: false });
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
    }
  },
  refreshUser: async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        set({ user: data.user, isSignedIn: true, isLoaded: true });
      } else {
        set({ user: null, isSignedIn: false, isLoaded: true });
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      set({ user: null, isSignedIn: false, isLoaded: true });
    }
  },
}));

/**
 * Custom hook to replace Clerk's useUser()
 * Returns user information and loading state
 */
export function useUser() {
  const { user, isLoaded, isSignedIn, refreshUser } = useAuthStore();

  useEffect(() => {
    if (!isLoaded) {
      refreshUser();
    }
  }, [isLoaded, refreshUser]);

  return {
    user: user
      ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          emailAddresses: [{ emailAddress: user.email }],
          imageUrl: user.imageUrl || `/api/avatar?name=${encodeURIComponent((user.firstName || user.email?.charAt(0) || "U"))}`,
          publicMetadata: { role: user.role },
        }
      : null,
    isLoaded,
    isSignedIn,
  };
}

/**
 * Custom hook to replace Clerk's useAuth()
 * Returns authentication state and actions
 */
export function useAuth() {
  const { user, isLoaded, isSignedIn, signOut } = useAuthStore();

  useEffect(() => {
    if (!isLoaded) {
      useAuthStore.getState().refreshUser();
    }
  }, [isLoaded]);

  return {
    userId: user?.id || null,
    isLoaded,
    isSignedIn,
    signOut,
  };
}

/**
 * Get user role from custom auth
 */
export function useRole(): string | null {
  const { user, isLoaded } = useAuthStore();
  
  useEffect(() => {
    if (!isLoaded) {
      useAuthStore.getState().refreshUser();
    }
  }, [isLoaded]);

  if (!isLoaded || !user) return null;
  return user.role;
}

// Export store for direct access if needed
export { useAuthStore };
