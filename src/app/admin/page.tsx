import { redirect } from "next/navigation";
import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import AdminDashboardHero from "@/components/admin/dashboard/AdminDashboardHero";
import AdminStatsGrid from "@/components/admin/dashboard/AdminStatsGrid";
import PendingVerifications from "@/components/admin/dashboard/PendingVerifications";
import { Suspense } from "react";
import { StatCardGridSkeleton, CardLoading } from "@/components/ui/loading-skeleton";
import { requireRole } from "@/lib/server/rbac";

/**
 * Admin Dashboard
 * 
 * Optimized for scalability:
 * - Uses getUserRoleFromSession() which has database fallback
 * - Middleware already handles admin route protection
 */
async function AdminPage() {
  const authResult = await requireRole("admin");
  if ("response" in authResult) {
    redirect("/sign-in");
  }

  return (
    <AdminDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-3xl mb-8" />}>
          <AdminDashboardHero />
        </Suspense>
        <Suspense fallback={<StatCardGridSkeleton count={5} />}>
          <AdminStatsGrid />
        </Suspense>
        <Suspense fallback={<CardLoading />}>
          <PendingVerifications />
        </Suspense>
      </div>
    </AdminDashboardLayout>
  );
}

export default AdminPage;
