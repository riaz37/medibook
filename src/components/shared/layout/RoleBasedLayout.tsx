"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useRole } from "@/hooks/use-role";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import Navbar from "@/components/Navbar";

interface RoleBasedLayoutProps {
  children: React.ReactNode;
  role?: "patient" | "doctor_pending" | "doctor" | "admin";
}

/**
 * Role-Based Layout Wrapper
 * Automatically selects the appropriate layout based on user role
 * Falls back to generic Navbar if role is not determined
 */
export function RoleBasedLayout({ children, role: propRole }: RoleBasedLayoutProps) {
  const { isLoaded } = useCurrentUser();
  const sessionRole = useRole();
  const role = propRole || sessionRole;

  // Use patient layout for patient role
  if (role === "patient") {
    return <PatientDashboardLayout>{children}</PatientDashboardLayout>;
  }

  // For doctor (pending or verified) and admin, use generic Navbar (they have their own layouts)
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

