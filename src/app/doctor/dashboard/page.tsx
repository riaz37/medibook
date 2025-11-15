import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DoctorDashboardClient from "./DoctorDashboardClient";

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
    redirect("/dashboard");
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

  // Get doctor's appointments
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: dbUser.doctorProfile?.id,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Get appointment stats
  const totalAppointments = appointments.length;
  const pendingAppointments = appointments.filter((apt) => apt.status === "PENDING").length;
  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.date) >= new Date() && (apt.status === "CONFIRMED" || apt.status === "PENDING")
  ).length;
  const completedAppointments = appointments.filter(
    (apt) => apt.status === "COMPLETED"
  ).length;

  return (
    <DoctorDashboardClient
      doctor={dbUser.doctorProfile}
      appointments={appointments}
      stats={{
        total: totalAppointments,
        upcoming: upcomingAppointments,
        completed: completedAppointments,
      }}
    />
  );
}

export default DoctorDashboardPage;

