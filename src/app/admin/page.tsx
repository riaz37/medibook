import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import AdminDashboardHero from "@/components/admin/dashboard/AdminDashboardHero";
import AdminStatsGrid from "@/components/admin/dashboard/AdminStatsGrid";
import DoctorVerificationsCard from "@/components/admin/dashboard/DoctorVerificationsCard";
import RecentActivity from "@/components/admin/dashboard/RecentActivity";
import QuickActions from "@/components/admin/dashboard/QuickActions";
import RecentAppointments from "@/components/admin/RecentAppointments";
import { RevenueChart } from "@/components/admin/dashboard/RevenueChart";
import { Suspense } from "react";
import { StatCardGridSkeleton, CardLoading } from "@/components/ui/loading-skeleton";
import { getUserRoleFromSession } from "@/lib/server/rbac";

/**
 * Admin Dashboard
 * 
 * Optimized for scalability:
 * - Uses getUserRoleFromSession() which has database fallback
 * - Middleware already handles admin route protection
 */
async function AdminPage() {
  const { userId } = await auth();

  // User is not logged in
  if (!userId) {
    redirect("/");
  }

  // Get role from session claims with database fallback
  const role = await getUserRoleFromSession();

  // If user doesn't have ADMIN role, redirect
  if (role !== "admin") {
    // Redirect based on user's actual role
    if (role === "doctor") {
      redirect("/doctor/dashboard");
    } else {
      redirect("/patient/dashboard");
    }
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
        <Suspense fallback={<CardLoading />}>
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
