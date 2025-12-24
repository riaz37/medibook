"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useRole } from "@/hooks/use-role";
import { PatientNavbar } from "./navbar/PatientNavbar";
import { DoctorNavbar } from "./navbar/DoctorNavbar";
import { AdminNavbar } from "./navbar/AdminNavbar";

function Navbar() {
  const { isLoaded } = useCurrentUser();
  const role = useRole();

  // Show appropriate navbar based on role
  if (!isLoaded || !role) {
    // Show patient navbar as default while loading
    return <PatientNavbar />;
  }

  if (role === "doctor") {
    return <DoctorNavbar />;
  }

  if (role === "admin") {
    return <AdminNavbar />;
  }

  // Default to patient navbar
  return <PatientNavbar />;
}

export default Navbar;
