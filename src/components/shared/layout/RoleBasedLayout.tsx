"use client";

import { useUser } from "@clerk/nextjs";
import { usersService } from "@/lib/services";
import { useEffect, useState } from "react";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import Navbar from "@/components/Navbar";

interface RoleBasedLayoutProps {
  children: React.ReactNode;
  role?: "patient" | "doctor" | "admin";
}

/**
 * Role-Based Layout Wrapper
 * Automatically selects the appropriate layout based on user role
 * Falls back to generic Navbar if role is not determined
 */
export function RoleBasedLayout({ children, role }: RoleBasedLayoutProps) {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string | null>(role || null);

  useEffect(() => {
    if (isLoaded && user && !role) {
      usersService.syncUserClient().then((syncedUser) => {
        if (syncedUser?.role) {
          setUserRole(syncedUser.role);
        }
      });
    }
  }, [isLoaded, user, role]);

  // Use patient layout for patient role
  if (userRole === "PATIENT" || role === "patient") {
    return <PatientDashboardLayout>{children}</PatientDashboardLayout>;
  }

  // For doctor and admin, use generic Navbar (they have their own layouts)
  // This can be extended later with DoctorDashboardLayout and AdminDashboardLayout
  return (
    <>
      <Navbar />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-24">
        {children}
      </div>
    </>
  );
}

