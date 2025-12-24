import { redirect } from "next/navigation";
import { requireRole } from "@/lib/server/rbac";

/**
 * Admin Doctor Applications Page
 * 
 * Redirects to unified Verifications page
 */
async function AdminDoctorApplicationsPage() {
  const authResult = await requireRole("admin");
  if ("response" in authResult) {
    redirect("/sign-in");
  }

  // Redirect to unified verifications page
  redirect("/admin/verifications");
}

export default AdminDoctorApplicationsPage;
