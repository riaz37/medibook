import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import DoctorApplicationsClient from "./DoctorApplicationsClient";
import { getUserRoleFromSession } from "@/lib/server/rbac";

/**
 * Admin Doctor Applications Page
 * 
 * Allows admins to review and approve/reject doctor applications
 */
async function AdminDoctorApplicationsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const role = await getUserRoleFromSession();

  if (role !== "admin") {
    redirect("/admin");
  }

  return (
    <AdminDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Doctor Applications</h1>
          <p className="text-muted-foreground">
            Review and manage doctor applications. Approve or reject applications based on qualifications.
          </p>
        </div>
        <DoctorApplicationsClient />
      </div>
    </AdminDashboardLayout>
  );
}

export default AdminDoctorApplicationsPage;
