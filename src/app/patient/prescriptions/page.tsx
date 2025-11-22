import { PatientPrescriptionList } from "@/components/patient/prescriptions/PrescriptionList";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";

export default function PatientPrescriptionsPage() {
  return (
    <PatientDashboardLayout>
      <div className="w-full">
        <PatientPrescriptionList />
      </div>
    </PatientDashboardLayout>
  );
}

