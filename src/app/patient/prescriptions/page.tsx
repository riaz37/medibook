import { redirect } from "next/navigation";
import { PatientPrescriptionList } from "@/components/patient/prescriptions/PrescriptionList";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import { getCurrentUser } from "@/lib/auth";
import { getAuthContext } from "@/lib/server/rbac";

async function PatientPrescriptionsPage() {
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
    <PatientDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Prescriptions</h1>
          <p className="text-muted-foreground">
            View and manage your prescriptions from your healthcare providers
          </p>
        </div>
        <PatientPrescriptionList />
      </div>
    </PatientDashboardLayout>
  );
}

export default PatientPrescriptionsPage;
