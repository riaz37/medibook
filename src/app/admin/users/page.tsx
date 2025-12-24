import { redirect } from "next/navigation";
import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import UsersManagementClient from "./UsersManagementClient";
import { requireRole } from "@/lib/server/rbac";

/**
 * Admin Users & Doctors Management Page
 * 
 * Unified page for managing user accounts, roles, and doctor profiles
 */
async function AdminUsersPage() {
  const authResult = await requireRole("admin");
  if ("response" in authResult) {
    redirect("/sign-in");
  }

  return (
    <AdminDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Users Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and roles. Filter by All, Doctor, or Patients.
          </p>
        </div>
        <UsersManagementClient />
      </div>
    </AdminDashboardLayout>
  );
}

export default AdminUsersPage;
