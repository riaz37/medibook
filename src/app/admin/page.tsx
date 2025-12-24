import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import AdminDashboardHero from "@/components/admin/dashboard/AdminDashboardHero";
import AdminStatsGrid from "@/components/admin/dashboard/AdminStatsGrid";
import DoctorVerificationsCard from "@/components/admin/dashboard/DoctorVerificationsCard";
import RecentActivity from "@/components/admin/dashboard/RecentActivity";
import QuickActions from "@/components/admin/dashboard/QuickActions";
import RecentAppointments from "@/components/admin/RecentAppointments";
import { Suspense } from "react";
import { StatCardGridSkeleton, CardLoading, ChartSkeleton } from "@/components/ui/loading-skeleton";
import { requireRole } from "@/lib/server/rbac";

// Lazy load chart component (heavy recharts dependency)
const RevenueChart = dynamic(
  () => import("@/components/admin/dashboard/RevenueChart").then((mod) => ({ default: mod.RevenueChart })),
  {
    loading: () => <ChartSkeleton height={300} />,
  }
);

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
        <Suspense fallback={<StatCardGridSkeleton count={4} />}>
          <AdminStatsGrid />
        </Suspense>
        <Suspense fallback={<ChartSkeleton height={300} />}>
          <RevenueChart />
        </Suspense>
        <QuickActions />
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Suspense fallback={<CardLoading />}>
              <RecentActivity />
            </Suspense>
          </div>
          <div>
            <Suspense fallback={<CardLoading />}>
              <DoctorVerificationsCard />
            </Suspense>
          </div>
        </div>
        <Suspense fallback={<CardLoading />}>
          <RecentAppointments />
        </Suspense>
      </div>
    </AdminDashboardLayout>
  );
}

export default AdminPage;
