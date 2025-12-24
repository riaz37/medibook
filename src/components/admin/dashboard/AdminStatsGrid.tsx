import { StatCard } from "@/components/shared/cards/StatCard";
import { Users, UserCheck, Calendar, CheckCircle2 } from "lucide-react";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getAdminStats = unstable_cache(
  async () => {
    try {
      // Use Promise.all for parallel execution and database aggregations
      const [totalDoctors, verifiedDoctors, totalAppointments, completedAppointments] =
        await Promise.all([
          prisma.doctor.count(),
          prisma.doctor.count({ where: { isVerified: true } }),
          prisma.appointment.count(),
          prisma.appointment.count({ where: { status: "COMPLETED" } }),
        ]);

      return {
        totalDoctors,
        verifiedDoctors,
        totalAppointments,
        completedAppointments,
      };
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      return {
        totalDoctors: 0,
        verifiedDoctors: 0,
        totalAppointments: 0,
        completedAppointments: 0,
      };
    }
  },
  ["admin-stats"],
  { revalidate: 60, tags: ["admin-stats"] }
);

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

