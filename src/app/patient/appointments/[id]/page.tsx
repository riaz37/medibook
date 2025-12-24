import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getAuthContext } from "@/lib/server/rbac";
import { PageLoading } from "@/components/ui/loading-skeleton";
import AppointmentDetailsPageClient from "./AppointmentDetailsPageClient";

async function AppointmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user || !user.role) {
    redirect("/sign-in");
  }

  // Check email verification
  if (!user.emailVerified) {
    redirect("/verify-email");
  }

  const context = await getAuthContext();

  // Redirect doctors (pending or verified) and admins to their respective dashboards
  if (context?.role === "doctor" || context?.role === "doctor_pending") {
    redirect("/doctor/dashboard");
  } else if (context?.role === "admin") {
    redirect("/admin");
  }

  return (
    <Suspense fallback={<PageLoading message="Loading appointment details..." />}>
      <AppointmentDetailsPageClient params={params} />
    </Suspense>
  );
}

export default AppointmentDetailsPage;

