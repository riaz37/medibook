import { redirect } from "next/navigation";
import { requireRole } from "@/lib/server/rbac";
import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import AdminSettingsClient from "./AdminSettingsClient";

async function AdminSettingsPage() {
  const authResult = await requireRole("admin");
  if ("response" in authResult) {
    redirect("/");
  }

  return (
    <AdminDashboardLayout>
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
          <p className="text-muted-foreground">
            Manage system settings and configurations
          </p>
        </div>
        <AdminSettingsClient />
      </div>
    </AdminDashboardLayout>
  );
}

export default AdminSettingsPage;
