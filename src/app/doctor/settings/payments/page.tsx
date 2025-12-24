import { getAuthContext } from "@/lib/server/rbac";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";
import PaymentSettingsClient from "./PaymentSettingsClient";

// Mark page as dynamic (uses auth which requires headers)
export const dynamic = "force-dynamic";

async function DoctorPaymentSettingsPage() {
  const user = await getCurrentUser();

  if (!user || !user.role) {
    redirect("/sign-in");
  }

  // Check email verification
  if (!user.emailVerified) {
    redirect("/verify-email");
  }

  const context = await getAuthContext();

  if (!context || (context.role !== "doctor" && context.role !== "doctor_pending") || !context.doctorId) {
    redirect("/sign-in");
  }

  return (
    <DoctorDashboardLayout>
      <div className="max-w-4xl mx-auto w-full">
        <PaymentSettingsClient doctorId={context.doctorId} />
      </div>
    </DoctorDashboardLayout>
  );
}

export default DoctorPaymentSettingsPage;

