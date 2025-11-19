import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import PatientProfileClient from "./PatientProfileClient";

async function PatientProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <PatientDashboardLayout>
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your personal information and account settings</p>
        </div>
        <PatientProfileClient />
      </div>
    </PatientDashboardLayout>
  );
}

export default PatientProfilePage;

