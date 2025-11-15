import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";
import DoctorDashboardHero from "@/components/doctor/dashboard/DoctorDashboardHero";
import DoctorStatsGrid from "@/components/doctor/dashboard/DoctorStatsGrid";
import UpcomingAppointments from "@/components/doctor/dashboard/UpcomingAppointments";
import QuickSettings from "@/components/doctor/dashboard/QuickSettings";
import ActivityFeed from "@/components/doctor/dashboard/ActivityFeed";

/**
 * Doctor Dashboard
 * 
 * Optimized for scalability:
 * - Uses session claims for role checking (no DB query for role)
 * - Only queries DB for doctor profile data (needed for dashboard)
 */
async function DoctorDashboardPage() {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  // Get role from session claims (more scalable than DB query)
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Check if user is a doctor (using session claims)
  if (role !== "doctor" && role !== "admin") {
    redirect("/patient/dashboard");
  }

  // Get user from database (only for doctor profile data)
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { doctorProfile: true },
  });

  if (!dbUser) {
    redirect("/select-role");
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

  return (
    <DoctorDashboardLayout>
      <div className="w-full">
        <DoctorDashboardHero />
        <DoctorStatsGrid />
        <QuickSettings doctor={doctor} />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <UpcomingAppointments />
          </div>
          <div>
            <ActivityFeed />
          </div>
        </div>
      </div>
    </DoctorDashboardLayout>
  );
}

export default DoctorDashboardPage;

