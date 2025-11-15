import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ActivityOverview from "@/components/dashboard/ActivityOverview";
import MainActions from "@/components/dashboard/MainActions";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import Navbar from "@/components/Navbar";

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
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
        <WelcomeSection />
        <MainActions />
        <ActivityOverview />
      </div>
    </>
  );
}

export default DashboardPage;
