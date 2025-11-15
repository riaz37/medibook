import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import DashboardHero from "@/components/patient/dashboard/DashboardHero";
import StatsGrid from "@/components/patient/dashboard/StatsGrid";
import ActivityFeed from "@/components/patient/dashboard/ActivityFeed";
import MainActions from "@/components/patient/dashboard/MainActions";
import NextAppointment from "@/components/patient/dashboard/NextAppointment";
import DentalHealthOverview from "@/components/patient/dashboard/DentalHealthOverview";

/**
 * Patient Dashboard
 * 
 * Optimized for scalability:
 * - Uses session claims for role checking (no DB query)
 * - Middleware already handles authentication
 */
async function DashboardPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/");
  }

  // Get role from session claims (set by Clerk metadata, synced by webhooks)
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Redirect if user needs to select role
  if (!role) {
    redirect("/select-role");
  }

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
          <DentalHealthOverview />
        </div>
        <div className="mt-6">
          <ActivityFeed />
        </div>
      </div>
    </PatientDashboardLayout>
  );
}

export default DashboardPage;
