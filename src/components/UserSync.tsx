"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { usersService } from "@/lib/services";
import { useRole } from "@/lib/hooks/use-role";

function UserSync() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const hasSynced = useRef(false);
  const role = useRole();

  useEffect(() => {
    const handleUserSync = async () => {
      // Only sync once per session
      if (hasSynced.current) {
        return;
      }

      if (isLoaded && isSignedIn) {
        try {
          hasSynced.current = true;
          // Sync user to database (ensures user exists in DB)
          await usersService.syncUserClient();
        } catch (error) {
          console.error("Failed to sync user:", error);
          hasSynced.current = false; // Allow retry on error
        }
      }
    };

    handleUserSync();
  }, [isLoaded, isSignedIn]);

  // Redirect based on role if on wrong page (using Clerk metadata role format)
  useEffect(() => {
    if (isLoaded && isSignedIn && role) {
      if (role === "doctor" && !pathname.startsWith("/doctor")) {
        router.push("/doctor/dashboard");
      } else if (role === "admin" && !pathname.startsWith("/admin")) {
        router.push("/admin");
      } else if (role === "patient" && (pathname.startsWith("/doctor") || pathname.startsWith("/admin"))) {
        router.push("/patient/dashboard");
      }
    }
  }, [isLoaded, isSignedIn, role, pathname, router]);

  return null;
}

export default UserSync;
