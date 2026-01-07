import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";
import ScheduleClient from "./ScheduleClient";
import { getAuthContext } from "@/lib/server/rbac";
import { getCurrentUser } from "@/lib/auth";

async function DoctorSchedulePage() {
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

  if (!context.doctorId) {
    redirect("/doctor/dashboard");
  }

  return (
    <DoctorDashboardLayout>
      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading schedule...</div>}>
        <ScheduleClient doctorId={context.doctorId} />
      </Suspense>
    </DoctorDashboardLayout>
  );
}

export default DoctorSchedulePage;

