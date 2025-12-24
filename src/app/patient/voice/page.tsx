import { redirect } from "next/navigation";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import FeatureCards from "@/components/patient/voice/FeatureCards";
import VapiWidget from "@/components/patient/voice/VapiWidget";
import WelcomeSection from "@/components/patient/voice/WelcomeSection";
import { getCurrentUser } from "@/lib/auth";
import { getAuthContext } from "@/lib/server/rbac";

async function VoicePage() {
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
          <h1 className="text-3xl font-bold mb-2">Voice Assistant</h1>
          <p className="text-muted-foreground">
            Get instant health advice and answers to your medical questions using our AI-powered voice assistant
          </p>
        </div>
        <WelcomeSection />
        <FeatureCards />
      </div>
      <VapiWidget />
    </PatientDashboardLayout>
  );
}

export default VoicePage;
