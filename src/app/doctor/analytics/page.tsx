import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAuthContext } from "@/lib/server/rbac";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";
import { getCurrentUser } from "@/lib/auth";
import { ChartSkeleton } from "@/components/ui/loading-skeleton";
import dynamic from "next/dynamic";

// Lazy load analytics client (contains heavy chart components)
const DoctorAnalyticsClient = dynamic(() => import("./DoctorAnalyticsClient"), {
  loading: () => <ChartSkeleton height={400} />,
});

async function DoctorAnalyticsPage() {
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

  if (!context.doctorId) {
    redirect("/doctor/dashboard");
  }

  return (
    <DoctorDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        <Suspense fallback={<ChartSkeleton height={400} />}>
          <DoctorAnalyticsClient doctorId={context.doctorId} />
        </Suspense>
      </div>
    </DoctorDashboardLayout>
  );
}

export default DoctorAnalyticsPage;

