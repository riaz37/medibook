import { redirect } from "next/navigation";
import { requireRole } from "@/lib/server/rbac";

/**
 * Admin Doctors Management Page
 * 
 * Redirects to unified Users Management page with doctor filter
 */
async function AdminDoctorsPage() {
  const authResult = await requireRole("admin");
  if ("response" in authResult) {
    redirect("/sign-in");
  }

  // Redirect to unified users page with doctor filter
  redirect("/admin/users");
}

export default AdminDoctorsPage;
