import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import DashboardHero from "@/components/patient/dashboard/DashboardHero";
import StatsGrid from "@/components/patient/dashboard/StatsGrid";
import MainActions from "@/components/patient/dashboard/MainActions";
import NextAppointment from "@/components/patient/dashboard/NextAppointment";
import { getUserRoleFromSession } from "@/lib/server/rbac";

/**
 * Patient Dashboard
 * 
 * Optimized for scalability:
 * - Uses getUserRoleFromSession() which has database fallback
 * - Middleware already handles authentication
 */
async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  // Get role from session claims with database fallback
  const role = await getUserRoleFromSession();

  // Redirect doctors and admins to their respective dashboards
  if (role === "doctor") {
    redirect("/doctor/dashboard");
  } else if (role === "admin") {
    redirect("/admin");
  }

  // Patient dashboard
  return (
    <PatientDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        <DashboardHero />
        <StatsGrid />
        <MainActions />
        <div className="grid lg:grid-cols-3 gap-6">
          <NextAppointment />
        </div>
      </div>
    </PatientDashboardLayout>
  );
}

export default DashboardPage;
