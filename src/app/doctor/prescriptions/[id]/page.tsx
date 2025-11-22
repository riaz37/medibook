import { PrescriptionDetails } from "@/components/doctor/prescriptions/PrescriptionDetails";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";
import { Suspense } from "react";
import { CardLoading } from "@/components/ui/loading-skeleton";

export default function DoctorPrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <DoctorDashboardLayout>
      <div className="w-full">
        <Suspense fallback={<CardLoading />}>
          <PrescriptionDetailsWrapper params={params} />
        </Suspense>
      </div>
    </DoctorDashboardLayout>
  );
}

async function PrescriptionDetailsWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PrescriptionDetails prescriptionId={id} />;
}

