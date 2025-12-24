import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import PatientPaymentsClient from "./PatientPaymentsClient";
import { getUserRoleFromSession } from "@/lib/server/rbac";

async function PatientPaymentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const role = await getUserRoleFromSession();

  if (role !== "patient") {
    if (role === "doctor") {
      redirect("/doctor/dashboard");
    } else if (role === "admin") {
      redirect("/admin");
    } else {
      // No role or unknown role - redirect to home
      redirect("/");
    }
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

