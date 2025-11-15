import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import FeatureCards from "@/components/patient/voice/FeatureCards";
import VapiWidget from "@/components/patient/voice/VapiWidget";
import WelcomeSection from "@/components/patient/voice/WelcomeSection";

async function VoicePage() {
  return (
    <PatientDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        <WelcomeSection />
        <FeatureCards />
      </div>
      <VapiWidget />
    </PatientDashboardLayout>
  );
}

export default VoicePage;
