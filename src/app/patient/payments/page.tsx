import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import PatientPaymentsClient from "./PatientPaymentsClient";

async function PatientPaymentsPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/");
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "patient") {
    if (role === "doctor") {
      redirect("/doctor/dashboard");
    } else if (role === "admin") {
      redirect("/admin");
    } else {
      redirect("/select-role");
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

