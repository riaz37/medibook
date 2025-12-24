import { redirect } from "next/navigation";
import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import UsersManagementClient from "./UsersManagementClient";
import { requireRole } from "@/lib/server/rbac";

/**
 * Admin Users Management Page
 * 
 * Allows admins to view and manage user roles
 */
async function AdminUsersPage() {
  const authResult = await requireRole("admin");
  if ("response" in authResult) {
    redirect("/");
  }

  return (
    <AdminDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Users Management</h1>
          <p className="text-muted-foreground">
            View and manage user roles. Change user roles with proper audit trail.
          </p>
        </div>
        <UsersManagementClient />
      </div>
    </AdminDashboardLayout>
  );
}

export default AdminUsersPage;
