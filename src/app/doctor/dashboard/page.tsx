import { redirect } from "next/navigation";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";
import DoctorDashboardHero from "@/components/doctor/dashboard/DoctorDashboardHero";
import TodaysSchedule from "@/components/doctor/dashboard/TodaysSchedule";
import DoctorStatsGrid from "@/components/doctor/dashboard/DoctorStatsGrid";
import { Suspense } from "react";
import { StatCardGridSkeleton, CardLoading } from "@/components/ui/loading-skeleton";
import { DashboardHeroSkeleton } from "@/components/shared";
import { getAuthContext } from "@/lib/server/rbac";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import Link from "next/link";

/**
 * Doctor Dashboard
 * 
 * Optimized for scalability:
 * - Uses getUserRoleFromSession() which has database fallback
 * - Only queries DB for doctor profile data (needed for dashboard)
 */
async function DoctorDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  // Check email verification
  if (!user.emailVerified) {
    redirect("/verify-email");
  }

  const context = await getAuthContext(true);
  if (!context) {
    redirect("/");
  }

  // Check if user is a doctor (pending or verified) or admin
  if (context.role !== "doctor" && context.role !== "doctor_pending" && context.role !== "admin") {
    redirect("/patient/dashboard");
  }

  // Get user from database (only for doctor profile data)
  const dbUser = await prisma.user.findUnique({
    where: { id: context.userId },
    include: { doctorProfile: true },
  });

  if (!dbUser) {
    redirect("/");
  }

  // Check if doctor profile exists and is complete
  if (!dbUser.doctorProfile) {
    redirect("/doctor/setup");
  }

  // Check if doctor needs to complete profile
  const doctor = dbUser.doctorProfile;
  const needsSetup = !doctor.speciality || !doctor.gender || doctor.speciality === "";

  if (needsSetup) {
    redirect("/doctor/setup");
  }

  // If doctor is pending approval, show pending message (no redirect)
  // Check both role and doctor verification status
  const isPendingApproval = context.role === "doctor_pending" && !doctor.isVerified;

  return (
    <DoctorDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        {/* Show pending approval banner only if doctor is not verified */}
        {isPendingApproval && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Pending Admin Approval</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Your doctor application is currently under review. You'll receive an email notification once your application has been approved. Until then, you have limited access to doctor features.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section - Compact */}
        <Suspense fallback={<DashboardHeroSkeleton />}>
          <DoctorDashboardHero />
        </Suspense>

        {/* Schedule Action Card */}
        <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                  <CalendarDays className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Schedule Management</CardTitle>
                  <CardDescription>Manage your working hours and availability</CardDescription>
                </div>
              </div>
              <Link href="/doctor/schedule">
                <Button variant="default">
                  Manage Schedule
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>

        {/* Today's Schedule - Primary Focus */}
        <Suspense fallback={<CardLoading />}>
          <TodaysSchedule />
        </Suspense>

        {/* Essential Stats - Minimal */}
        <Suspense fallback={<StatCardGridSkeleton count={2} />}>
          <DoctorStatsGrid />
        </Suspense>
      </div>
    </DoctorDashboardLayout>
  );
}

export default DoctorDashboardPage;
