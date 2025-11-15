import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import AdminDashboardHero from "@/components/admin/dashboard/AdminDashboardHero";
import AdminStatsGrid from "@/components/admin/dashboard/AdminStatsGrid";
import DoctorVerificationsCard from "@/components/admin/dashboard/DoctorVerificationsCard";
import RecentActivity from "@/components/admin/dashboard/RecentActivity";
import QuickActions from "@/components/admin/dashboard/QuickActions";
import DoctorsManagement from "@/components/admin/DoctorsManagement";
import RecentAppointments from "@/components/admin/RecentAppointments";

/**
 * Admin Dashboard
 * 
 * Optimized for scalability:
 * - Uses session claims for role checking (no DB query)
 * - Middleware already handles admin route protection
 */
async function AdminPage() {
  const { userId, sessionClaims } = await auth();

  // User is not logged in
  if (!userId) {
    redirect("/");
  }

  // Get role from session claims (more scalable than DB query)
  const role = (sessionClaims?.metadata as { role?: string })?.role;

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
        <AdminDashboardHero />
        <AdminStatsGrid />
        <QuickActions />
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <DoctorVerificationsCard />
          </div>
          <div>
            <RecentActivity />
          </div>
        </div>
        <DoctorsManagement />
        <RecentAppointments />
      </div>
    </AdminDashboardLayout>
  );
}

export default AdminPage;
