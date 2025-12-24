import { redirect } from "next/navigation";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import DashboardHero from "@/components/patient/dashboard/DashboardHero";
import StatsGrid from "@/components/patient/dashboard/StatsGrid";
import QuickActions from "@/components/patient/dashboard/QuickActions";
import NextAppointment from "@/components/patient/dashboard/NextAppointment";
import { getCurrentUser } from "@/lib/auth";
import { getAuthContext } from "@/lib/server/rbac";

/**
 * Patient Dashboard
 * 
 * Optimized for scalability:
 * - Uses custom authentication with database
 * - Middleware already handles authentication
 */
async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user || !user.role) {
    redirect("/sign-in");
  }

  // Check email verification
  if (!user.emailVerified) {
    redirect("/verify-email");
  }

  const context = await getAuthContext();
  
  // Redirect doctors (pending or verified) and admins to their respective dashboards
  if (context?.role === "doctor" || context?.role === "doctor_pending") {
    redirect("/doctor/dashboard");
  } else if (context?.role === "admin") {
    redirect("/admin");
  }

  return (
    <PatientDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        {/* Hero Section - Compact */}
        <DashboardHero />

        {/* Next Appointment - Primary Focus */}
        <NextAppointment />

        {/* Quick Actions - Essential Only */}
        <QuickActions />

        {/* Essential Stats - Minimal */}
        <StatsGrid />
      </div>
    </PatientDashboardLayout>
  );
}

export default DashboardPage;
