import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getAuthContext } from "@/lib/server/rbac";
import { PageLoading } from "@/components/ui/loading-skeleton";
import DoctorAppointmentsPageClient from "./DoctorAppointmentsPageClient";

async function DoctorAppointmentsPage() {
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
    redirect("/patient/dashboard");
  }

  return (
    <Suspense fallback={<PageLoading message="Loading appointments..." />}>
      <DoctorAppointmentsPageClient />
    </Suspense>
  );
}

export default DoctorAppointmentsPage;
