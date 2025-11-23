import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import SelectRoleClient from "./SelectRoleClient";

/**
 * Select Role Page
 * 
 * Server component that checks if user already has a role
 * and redirects them appropriately (especially admins)
 */
export default async function SelectRolePage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/");
  }

  // Check role from session claims first (most efficient)
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // If user already has a role in session claims, redirect them
  if (role === "admin") {
    redirect("/admin");
  } else if (role === "doctor") {
    redirect("/doctor/dashboard");
  } else if (role === "patient") {
    redirect("/dashboard");
  }

  // Fallback: Check database if session claims don't have role yet
  // This handles cases where webhook hasn't synced metadata yet
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (dbUser?.role) {
    // User has role in DB but not in session claims
    // Update Clerk metadata to sync it, then redirect
    // This prevents redirect loops
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          role: dbUser.role.toLowerCase(),
        },
      });
    } catch (error) {
      console.error("Error updating Clerk metadata:", error);
      // Continue with redirect even if metadata update fails
    }

    // Redirect based on role
    if (dbUser.role === "ADMIN") {
      redirect("/admin");
    } else if (dbUser.role === "DOCTOR") {
      redirect("/doctor/dashboard");
    } else if (dbUser.role === "PATIENT") {
      redirect("/dashboard");
    }
  }

  // User has no role - show role selection page
  return <SelectRoleClient />;
}

