import { PatientPrescriptionDetails } from "@/components/patient/prescriptions/PrescriptionDetails";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import { Suspense } from "react";
import { CardLoading } from "@/components/ui/loading-skeleton";

export default function PatientPrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <PatientDashboardLayout>
      <div className="w-full">
        <Suspense fallback={<CardLoading />}>
          <PrescriptionDetailsWrapper params={params} />
        </Suspense>
      </div>
    </PatientDashboardLayout>
  );
}

async function PrescriptionDetailsWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientPrescriptionDetails prescriptionId={id} />;
}

