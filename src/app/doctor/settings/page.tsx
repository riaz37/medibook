import { redirect } from "next/navigation";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";
import DoctorSettingsClient from "./DoctorSettingsClient";
import { getAuthContext } from "@/lib/server/rbac";
import { getCurrentUser } from "@/lib/auth";
import type { DoctorSettingsData, DoctorVerificationData } from "@/lib/types";

async function DoctorSettingsPage() {
  const user = await getCurrentUser();

  if (!user || !user.role) {
    redirect("/sign-in");
  }

  // Check email verification
  if (!user.emailVerified) {
    redirect("/verify-email");
  }

  const context = await getAuthContext();
  if (!context) {
    redirect("/sign-in");
  }

  // Check if user is a doctor (pending or verified) or admin
  if (context.role !== "doctor" && context.role !== "doctor_pending" && context.role !== "admin") {
    redirect("/sign-in");
  }

  // Get user from database for doctor profile
  const dbUser = await prisma.user.findUnique({
    where: { id: context.userId },
    include: { doctorProfile: true },
  });

  if (!dbUser) {
    redirect("/sign-in");
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

  // Serialize doctor object - convert Decimal fields to strings for client component
  const serializedDoctor: DoctorSettingsData = {
    id: doctor.id,
    name: doctor.name,
    email: doctor.email,
    phone: doctor.phone,
    speciality: doctor.speciality,
    bio: doctor.bio,
    gender: doctor.gender,
    isVerified: doctor.isVerified,
  };

  // Serialize verification object - convert Date to ISO string
  const serializedVerification: DoctorVerificationData | null = verification
    ? {
        id: verification.id,
        status: verification.status as "PENDING" | "APPROVED" | "REJECTED",
        licenseUrl: verification.licenseUrl,
        certificateUrl: verification.certificateUrl,
        idDocumentUrl: verification.idDocumentUrl,
        submittedAt: verification.submittedAt ? new Date(verification.submittedAt).toISOString() : null,
        rejectionReason: verification.rejectionReason,
      }
    : null;

  return (
    <DoctorDashboardLayout>
      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading settings...</div>}>
        <DoctorSettingsClient doctor={serializedDoctor} verification={serializedVerification} />
      </Suspense>
    </DoctorDashboardLayout>
  );
}

export default DoctorSettingsPage;
