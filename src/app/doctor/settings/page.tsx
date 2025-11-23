import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";
import DoctorSettingsClient from "./DoctorSettingsClient";

async function DoctorSettingsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { doctorProfile: true },
  });

  if (!dbUser || dbUser.role !== "DOCTOR") {
    redirect("/select-role");
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

