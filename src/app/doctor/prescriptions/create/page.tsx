import { CreatePrescriptionForm } from "@/components/doctor/prescriptions/CreatePrescriptionForm";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";
import { Suspense } from "react";
import { CardLoading } from "@/components/ui/loading-skeleton";

export default function CreatePrescriptionPage() {
  return (
    <DoctorDashboardLayout>
      <div className="w-full max-w-4xl mx-auto">
        <Suspense fallback={<CardLoading />}>
          <CreatePrescriptionForm />
        </Suspense>
      </div>
    </DoctorDashboardLayout>
  );
}

