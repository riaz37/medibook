import { redirect } from "next/navigation";
import { requireRole } from "@/lib/server/rbac";
import AdminVerificationsPageClient from "./AdminVerificationsPageClient";

/**
 * Admin Doctor Verifications Page
 * 
 * Allows admins to review and approve doctor verification documents
 */
async function AdminVerificationsPage() {
  const authResult = await requireRole("admin");
  if ("response" in authResult) {
    redirect("/sign-in");
  }

  return <AdminVerificationsPageClient />;
}

export default AdminVerificationsPage;
