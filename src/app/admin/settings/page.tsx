import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import AdminSettingsClient from "./AdminSettingsClient";

async function AdminSettingsPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/");
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/admin");
  }

  return (
    <AdminDashboardLayout>
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
          <p className="text-muted-foreground">Manage system settings and configurations</p>
        </div>
        <AdminSettingsClient />
      </div>
    </AdminDashboardLayout>
  );
}

export default AdminSettingsPage;

