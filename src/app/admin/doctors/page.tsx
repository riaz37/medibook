import { redirect } from "next/navigation";
import { requireRole } from "@/lib/server/rbac";
import AdminDoctorsPageClient from "./AdminDoctorsPageClient";

/**
 * Admin Doctors Management Page
 * 
 * Allows admins to view and manage all doctors
 */
async function AdminDoctorsPage() {
  const authResult = await requireRole("admin");
  if ("response" in authResult) {
    redirect("/sign-in");
  }

  return <AdminDoctorsPageClient />;
}

export default AdminDoctorsPage;
