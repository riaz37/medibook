"use client";

import { useUser, useRole } from "@/hooks/use-auth";
import { PatientNavbar } from "./navbar/PatientNavbar";
import { DoctorNavbar } from "./navbar/DoctorNavbar";
import { AdminNavbar } from "./navbar/AdminNavbar";

function Navbar() {
  const { isLoaded } = useUser();
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
