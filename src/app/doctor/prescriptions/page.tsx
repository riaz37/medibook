import { PrescriptionList } from "@/components/doctor/prescriptions/PrescriptionList";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";

export default function DoctorPrescriptionsPage() {
  return (
    <DoctorDashboardLayout>
      <div className="w-full">
        <PrescriptionList />
      </div>
    </DoctorDashboardLayout>
  );
}

