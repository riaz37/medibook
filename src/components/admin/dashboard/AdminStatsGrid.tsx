import { StatCard } from "@/components/ui/stat-card";
import { Users, UserCheck, Calendar, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/server/auth-utils";

async function getAdminStats() {
  try {
    const doctors = await prisma.doctor.findMany({
      select: { id: true, isVerified: true },
    });

    const appointments = await prisma.appointment.findMany({
      select: { status: true },
    });

    return {
      totalDoctors: doctors.length,
      verifiedDoctors: doctors.filter((d) => d.isVerified).length,
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter((a) => a.status === "COMPLETED").length,
    };
  } catch {
    return {
      totalDoctors: 0,
      verifiedDoctors: 0,
      totalAppointments: 0,
      completedAppointments: 0,
    };
  }
}

export default async function AdminStatsGrid() {
  const stats = await getAdminStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <StatCard
        title="Total Doctors"
        value={stats.totalDoctors}
        description="All registered doctors"
        icon={Users}
        href="/admin/doctors"
      />
      <StatCard
        title="Verified Doctors"
        value={stats.verifiedDoctors}
        description="Approved and active"
        icon={UserCheck}
        href="/admin/doctors?filter=verified"
      />
      <StatCard
        title="Total Appointments"
        value={stats.totalAppointments}
        description="All time appointments"
        icon={Calendar}
        href="/admin/appointments"
      />
      <StatCard
        title="Completed"
        value={stats.completedAppointments}
        description="Finished appointments"
        icon={CheckCircle2}
        href="/admin/appointments?status=completed"
      />
    </div>
  );
}

