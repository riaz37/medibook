"use client";

import { DoctorAnalyticsSection } from "@/components/doctor/dashboard/DoctorAnalyticsSection";

interface DoctorAnalyticsClientProps {
  doctorId: string;
}

export default function DoctorAnalyticsClient({ doctorId }: DoctorAnalyticsClientProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          Track your performance, revenue trends, and appointment activity over time
        </p>
      </div>

      {/* Analytics Section */}
      <DoctorAnalyticsSection doctorId={doctorId} />
    </div>
  );
}

