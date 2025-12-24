import { redirect } from "next/navigation";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";
import DoctorSettingsClient from "./DoctorSettingsClient";
import { getUserRoleFromSession, getAuthContext } from "@/lib/server/rbac";

async function DoctorSettingsPage() {
  const context = await getAuthContext();
  if (!context) {
    redirect("/");
  }

  // Get role with database fallback
  const role = await getUserRoleFromSession();

  if (role !== "doctor" && role !== "admin") {
    redirect("/");
  }

  // Get user from database for doctor profile
  const dbUser = await prisma.user.findUnique({
    where: { id: context.userId },
    include: { doctorProfile: true },
  });

  if (!dbUser) {
    redirect("/");
  }

  // Check if doctor profile exists
  if (!dbUser.doctorProfile) {
    redirect("/doctor/setup");
  }

  const doctor = dbUser.doctorProfile;

  // Get verification status
  const verification = await (prisma as any).doctorVerification?.findUnique({
    where: { doctorId: doctor.id },
  }).catch(() => null);

  return (
    <DoctorDashboardLayout>
      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading settings...</div>}>
        <DoctorSettingsClient doctor={doctor} verification={verification} />
      </Suspense>
    </DoctorDashboardLayout>
  );
}

export default DoctorSettingsPage;
