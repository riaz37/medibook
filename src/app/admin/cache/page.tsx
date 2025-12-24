import { Metadata } from "next";
import { requireRole } from "@/lib/server/rbac";
import { redirect } from "next/navigation";
import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import CacheDashboardClient from "./CacheDashboardClient";

// Mark page as dynamic (uses auth which requires headers)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cache Management | MediBook Admin",
  description: "Monitor and manage application cache",
};

export default async function CacheManagementPage() {
  const authResult = await requireRole("admin");
  if ("response" in authResult) {
    redirect("/sign-in");
  }

  return (
    <AdminDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Cache Management</h1>
          <p className="text-muted-foreground">
            Monitor cache performance and manage cache entries.
          </p>
        </div>
        <CacheDashboardClient />
      </div>
    </AdminDashboardLayout>
  );
}
