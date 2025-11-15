"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { usersService } from "@/lib/services";
import { PatientNavbar } from "./navbar/PatientNavbar";
import { DoctorNavbar } from "./navbar/DoctorNavbar";
import { AdminNavbar } from "./navbar/AdminNavbar";

function Navbar() {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      usersService.syncUserClient().then((syncedUser) => {
        if (syncedUser?.role) {
          setUserRole(syncedUser.role);
        }
      });
    }
  }, [isLoaded, user]);

  // Show appropriate navbar based on role
  if (!isLoaded || !userRole) {
    // Show patient navbar as default while loading
    return <PatientNavbar />;
  }

  if (userRole === "DOCTOR") {
    return <DoctorNavbar />;
  }

  if (userRole === "ADMIN") {
    return <AdminNavbar />;
  }

  // Default to patient navbar
  return <PatientNavbar />;
}

export default Navbar;
