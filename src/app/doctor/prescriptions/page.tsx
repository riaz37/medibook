import { redirect } from "next/navigation";
import { PrescriptionList } from "@/components/doctor/prescriptions/PrescriptionList";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";
import { getCurrentUser } from "@/lib/auth";
import { getAuthContext } from "@/lib/server/rbac";

async function DoctorPrescriptionsPage() {
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
    <DoctorDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Prescriptions</h1>
          <p className="text-muted-foreground">
            View and manage prescriptions for your patients
          </p>
        </div>
        <PrescriptionList />
      </div>
    </DoctorDashboardLayout>
  );
}

export default DoctorPrescriptionsPage;
