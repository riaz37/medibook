"use client";

import AdminStats from "@/components/admin/AdminStats";
import DoctorsManagement from "@/components/admin/DoctorsManagement";
import RecentAppointments from "@/components/admin/RecentAppointments";
import DoctorVerifications from "@/components/admin/DoctorVerifications";
import Navbar from "@/components/Navbar";
import { useGetAppointments } from "@/hooks/use-appointment";
import { useGetDoctors } from "@/hooks/use-doctors";
import { SettingsIcon } from "lucide-react";
import { PageLoading } from "@/components/ui/loading-skeleton";

function AdminDashboardClient() {
  const { data: doctors = [], isLoading: doctorsLoading } = useGetDoctors();
  const { data: appointments = [], isLoading: appointmentsLoading } = useGetAppointments();

  // calculate stats from real data
  const stats = {
    totalDoctors: doctors.length,
    verifiedDoctors: doctors.filter((doc) => doc.isVerified).length,
    totalAppointments: appointments.length,
    completedAppointments: appointments.filter((app) => app.status === "COMPLETED").length,
  };

  if (doctorsLoading || appointmentsLoading) return <LoadingUI />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
        <AdminStats
          totalDoctors={stats.totalDoctors}
          activeDoctors={stats.verifiedDoctors}
          totalAppointments={stats.totalAppointments}
          completedAppointments={stats.completedAppointments}
        />

        <div className="mb-6">
          <DoctorVerifications />
        </div>

        <DoctorsManagement />

        <RecentAppointments />
      </div>
    </div>
  );
}

export default AdminDashboardClient;

function LoadingUI() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
        <PageLoading message="Loading dashboard..." />
      </div>
    </div>
  );
}
