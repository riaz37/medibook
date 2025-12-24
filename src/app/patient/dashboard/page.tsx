import { redirect } from "next/navigation";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import DashboardHero from "@/components/patient/dashboard/DashboardHero";
import StatsGrid from "@/components/patient/dashboard/StatsGrid";
import MainActions from "@/components/patient/dashboard/MainActions";
import NextAppointment from "@/components/patient/dashboard/NextAppointment";
import { getCurrentUser } from "@/lib/auth";

/**
 * Patient Dashboard
 * 
 * Optimized for scalability:
 * - Uses custom authentication with database
 * - Middleware already handles authentication
 */
async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get role from user
  const role = user.role?.name || user.userRole.toLowerCase();

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
