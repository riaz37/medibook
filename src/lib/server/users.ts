"use server";

/**
 * Server-only user utilities
 * These functions use server-only Clerk APIs and should never be imported in client components
 */

import { currentUser, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import type { User } from "@/lib/types";

/**
 * Optimized sync user from Clerk to database
 * This is a fallback - webhooks should handle most user sync automatically
 * Use this only when webhook hasn't synced yet (e.g., first request after sign-in)
 * 
 * Optimizations:
 * - Single upsert query instead of multiple findUnique calls
 * - Idempotent - safe to call multiple times
 * - Minimal database queries
 */
export async function syncUserDirect(): Promise<User | null> {
  try {
    const user = await currentUser();
    if (!user) {
      return null;
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error("User has no email address");
      return null;
    }

    // Check if email is in admin list (from environment variable)
    // Format: ADMIN_EMAILS=admin1@example.com,admin2@example.com
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
    const isAdminEmail = adminEmails.includes(email.toLowerCase());
    const defaultRole = isAdminEmail ? "ADMIN" : "PATIENT";

    // Single upsert operation - handles both create and update
    // This is idempotent and handles race conditions
    const dbUser = await prisma.user.upsert({
      where: { clerkId: user.id },
      update: {
        // Only update fields that might have changed in Clerk
        email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        phone: user.phoneNumbers[0]?.phoneNumber || undefined,
        // Update role if email is admin (for existing users who become admin)
        ...(isAdminEmail && { role: "ADMIN" }),
      },
      create: {
        clerkId: user.id,
        email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phoneNumbers[0]?.phoneNumber,
        role: defaultRole,
      },
      include: { doctorProfile: true },
    });

    // Update Clerk metadata if user is admin (for session claims)
    if (isAdminEmail) {
      const client = await clerkClient();
      await client.users.updateUserMetadata(user.id, {
        publicMetadata: {
          role: "admin",
        },
      });
    }

    // If user exists but has no role, they need to select one
    if (!dbUser.role) {
      return { ...dbUser, needsRoleSelection: true } as User & { needsRoleSelection: boolean };
    }

    return dbUser as User;
  } catch (error) {
    console.error("Error syncing user:", error);

    // Handle unique constraint on email (if clerkId doesn't exist but email does)
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      try {
        const user = await currentUser();
        if (user) {
          const email = user.emailAddresses[0]?.emailAddress;
          if (email) {
            // Try to find by email and update clerkId
            const existingUser = await prisma.user.findUnique({
              where: { email },
              include: { doctorProfile: true },
            });

            if (existingUser && existingUser.clerkId !== user.id) {
              const updated = await prisma.user.update({
                where: { id: existingUser.id },
                data: { clerkId: user.id },
                include: { doctorProfile: true },
              });
              return updated.role
                ? (updated as User)
                : ({ ...updated, needsRoleSelection: true } as User & { needsRoleSelection: boolean });
            }

            if (existingUser) {
              return existingUser.role
                ? (existingUser as User)
                : ({ ...existingUser, needsRoleSelection: true } as User & { needsRoleSelection: boolean });
            }
          }
        }
      } catch (retryError) {
        console.error("Error retrying user sync:", retryError);
      }
    }

    return null;
  }
}

