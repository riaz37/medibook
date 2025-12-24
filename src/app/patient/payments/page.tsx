import { redirect } from "next/navigation";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import PatientPaymentsClient from "./PatientPaymentsClient";
import { getCurrentUser } from "@/lib/auth";
import { getAuthContext } from "@/lib/server/rbac";

async function PatientPaymentsPage() {
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

  // Redirect doctors (pending or verified) and admins to their dashboards
  if (context.role === "doctor" || context.role === "doctor_pending") {
    redirect("/doctor/dashboard");
  } else if (context.role === "admin") {
    redirect("/admin");
  }

  return (
    <PatientDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        <PatientPaymentsClient />
      </div>
    </PatientDashboardLayout>
  );
}

export default PatientPaymentsPage;

