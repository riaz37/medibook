import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";
import DoctorDashboardHero from "@/components/doctor/dashboard/DoctorDashboardHero";
import DoctorStatsGrid from "@/components/doctor/dashboard/DoctorStatsGrid";
import UpcomingAppointments from "@/components/doctor/dashboard/UpcomingAppointments";
import ActivityFeed from "@/components/doctor/dashboard/ActivityFeed";
import { DoctorAnalyticsSection } from "@/components/doctor/dashboard/DoctorAnalyticsSection";
import { Suspense } from "react";
import { StatCardGridSkeleton, CardLoading } from "@/components/ui/loading-skeleton";
import { getUserRoleFromSession } from "@/lib/server/rbac";
import prisma from "@/lib/prisma";

/**
 * Doctor Dashboard
 * 
 * Optimized for scalability:
 * - Uses getUserRoleFromSession() which has database fallback
 * - Only queries DB for doctor profile data (needed for dashboard)
 */
async function DoctorDashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  // Get role from session claims with database fallback
  const role = await getUserRoleFromSession();

  // Check if user is a doctor
  if (role !== "doctor" && role !== "admin") {
    redirect("/patient/dashboard");
  }

  // Get user from database (only for doctor profile data)
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { doctorProfile: true },
  });

  if (!dbUser) {
    redirect("/");
  }

  // Check if doctor profile exists and is complete
  if (!dbUser.doctorProfile) {
    redirect("/doctor/setup");
  }

  // Check if doctor needs to complete profile or verification
  const doctor = dbUser.doctorProfile;
  const needsSetup = !doctor.speciality || !doctor.gender || doctor.speciality === "";
  
  if (needsSetup) {
    redirect("/doctor/setup");
  }

  // Get verification status (after migration, use: prisma.doctorVerification)
  const verification = await (prisma as any).doctorVerification?.findUnique({
    where: { doctorId: doctor.id },
  }).catch(() => null);

  // Check verification status - redirect if rejected
  if (verification?.status === "REJECTED") {
    redirect("/doctor/setup");
  }

  // Check if doctor is verified (for new doctors, they need to be verified)
  if (!doctor.isVerified && verification?.status !== "PENDING") {
    // If verification doesn't exist or is not pending, redirect to setup
    if (!verification || verification.status !== "PENDING") {
      redirect("/doctor/setup");
    }
  }

  // Get doctorId for analytics
  const context = await getAuthContext();
  const doctorId = context?.doctorId || doctor.id;

  return (
    <DoctorDashboardLayout>
      <div className="w-full">
        <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-3xl mb-8" />}>
          <DoctorDashboardHero />
        </Suspense>
        <Suspense fallback={<StatCardGridSkeleton count={4} />}>
          <DoctorStatsGrid />
        </Suspense>
        <Suspense fallback={<CardLoading />}>
          <DoctorAnalyticsSection doctorId={doctorId} />
        </Suspense>
        <div className="grid lg:grid-cols-3 gap-6">
          <div>
            <Suspense fallback={<CardLoading />}>
              <UpcomingAppointments />
            </Suspense>
          </div>
          <div className="lg:col-span-2">
            <Suspense fallback={<CardLoading />}>
              <ActivityFeed />
            </Suspense>
          </div>
        </div>
      </div>
    </DoctorDashboardLayout>
  );
}

export default DoctorDashboardPage;

