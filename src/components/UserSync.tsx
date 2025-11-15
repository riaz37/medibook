"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { usersService } from "@/lib/services";

function UserSync() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleUserSync = async () => {
      if (isLoaded && isSignedIn) {
        try {
          const user = await usersService.syncUserClient();
          
          // Check if user needs to select role
          if (user && (user as any).needsRoleSelection && pathname !== "/select-role") {
            router.push("/select-role");
            return;
          }

          // Redirect based on role if on wrong page
          if (user && user.role && pathname !== "/select-role") {
            if (user.role === "DOCTOR" && !pathname.startsWith("/doctor")) {
              router.push("/doctor/dashboard");
            } else if (user.role === "ADMIN" && !pathname.startsWith("/admin")) {
              router.push("/admin");
            } else if (user.role === "PATIENT" && (pathname.startsWith("/doctor") || pathname.startsWith("/admin"))) {
              router.push("/patient/dashboard");
            }
          }
        } catch (error) {
          console.log("Failed to sync user", error);
        }
      }
    };

    handleUserSync();
  }, [isLoaded, isSignedIn, router, pathname]);

  return null;
}

export default UserSync;
