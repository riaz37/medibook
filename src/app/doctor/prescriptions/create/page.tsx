import { redirect } from "next/navigation";
import { CreatePrescriptionForm } from "@/components/doctor/prescriptions/CreatePrescriptionForm";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";
import { Suspense } from "react";
import { CardLoading } from "@/components/ui/loading-skeleton";
import { getCurrentUser } from "@/lib/auth";
import { getAuthContext } from "@/lib/server/rbac";

async function CreatePrescriptionPage() {
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
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Prescription</h1>
          <p className="text-muted-foreground">
            Create a new prescription for your patient
          </p>
        </div>
        <Suspense fallback={<CardLoading />}>
          <CreatePrescriptionForm />
        </Suspense>
      </div>
    </DoctorDashboardLayout>
  );
}

export default CreatePrescriptionPage;

