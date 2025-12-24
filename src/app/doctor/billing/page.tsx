import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server/rbac";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";
import DoctorBillingClient from "./DoctorBillingClient";
import { getCurrentUser } from "@/lib/auth";

async function DoctorBillingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role = user.role?.name || user.userRole.toLowerCase();

  if (role !== "doctor" && role !== "admin") {
    redirect("/patient/dashboard");
  }

  const context = await getAuthContext();
  if (!context || !context.doctorId) {
    redirect("/doctor/dashboard");
  }

  return (
    <DoctorDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        <DoctorBillingClient doctorId={context.doctorId} />
      </div>
    </DoctorDashboardLayout>
  );
}

export default DoctorBillingPage;

