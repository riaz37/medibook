import { redirect } from "next/navigation";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import DoctorApplicationForm from "@/components/doctor/DoctorApplicationForm";
import { getCurrentUser } from "@/lib/auth";
import { getAuthContext } from "@/lib/server/rbac";
import prisma from "@/lib/prisma";

/**
 * Doctor Application Page
 * 
 * Allows authenticated patients to apply to become doctors
 */
async function DoctorApplyPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const context = await getAuthContext();

  // Redirect doctors (pending or verified) and admins away (they don't need to apply)
  if (context?.role === "doctor" || context?.role === "doctor_pending") {
    redirect("/doctor/dashboard");
  } else if (context?.role === "admin") {
    redirect("/admin");
  }

  // Check if user already has a doctor application
  const existingApplication = await prisma.doctorApplication.findUnique({
    where: { userId: user.id },
  });

  // If they have a pending application, redirect to dashboard (status shown there)
  if (existingApplication?.status === "PENDING") {
    redirect("/patient/dashboard");
  }

  // If they have an approved application (shouldn't happen, but handle it)
  if (existingApplication?.status === "APPROVED") {
    redirect("/doctor/dashboard");
  }

  return (
    <PatientDashboardLayout>
      <div className="max-w-3xl mx-auto w-full py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Apply to Become a Doctor</h1>
          <p className="text-muted-foreground">
            Join our network of healthcare professionals and start helping patients today.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 mb-6">
          <h2 className="font-semibold mb-3">Application Process</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              <span>Fill out the application form below with your medical credentials</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              <span>Our admin team will review your application</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              <span>You'll receive an email notification once your application is reviewed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">4.</span>
              <span>Once approved, you'll gain access to the doctor dashboard</span>
            </li>
          </ul>
        </div>

        <DoctorApplicationForm />
      </div>
    </PatientDashboardLayout>
  );
}

export default DoctorApplyPage;

