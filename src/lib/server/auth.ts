"use server";

/**
 * Server-only authentication utilities
 * These functions use server-only Clerk APIs and should never be imported in client components
 */

import { currentUser, auth } from "@clerk/nextjs/server";
import type { AuthUser } from "@/lib/types";

/**
 * Get current authenticated user (server-side)
 */
export async function getCurrentUser() {
  return await currentUser();
}

/**
 * Get auth object (server-side)
 */
export async function getAuth() {
  return await auth();
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const authObj = await auth();
  return !!authObj.userId;
}

/**
 * Get user ID from auth (server-side)
 */
export async function getUserId(): Promise<string | null> {
  const authObj = await auth();
  return authObj.userId || null;
}

/**
 * Check if user has a specific permission/plan (server-side)
 */
export async function hasPermission(params: { permission: string } | { role: string } | { plan: string }): Promise<boolean> {
  const authObj = await auth();
  return authObj.has(params as any);
}

