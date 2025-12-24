import { StatCard } from "@/components/ui/stat-card";
import { Calendar, CheckCircle2, List, AlertCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/server/rbac";
import { getDoctorStats } from "@/lib/utils/appointments";

export default async function DoctorStatsGrid() {
  const authResult = await requireAuth();
  let stats = { total: 0, pending: 0, upcoming: 0, completed: 0 };

  if ("response" in authResult) {
    // If auth fails, return default stats (component will still render with zeros)
  } else {
    const { context } = authResult;
    try {
      if (context.doctorId) {
        stats = await getDoctorStats(context.doctorId);
      }
    } catch (error) {
      console.error("Error fetching doctor stats:", error);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <StatCard
        title="Total Appointments"
        value={stats.total}
        description="All time appointments"
        icon={List}
        href="/doctor/appointments"
      />
      <StatCard
        title="Pending"
        value={stats.pending}
        description="Awaiting confirmation"
        icon={AlertCircle}
        href="/doctor/appointments?status=pending"
      />
      <StatCard
        title="Upcoming"
        value={stats.upcoming}
        description="Scheduled appointments"
        icon={Calendar}
        href="/doctor/appointments?status=upcoming"
      />
      <StatCard
        title="Completed"
        value={stats.completed}
        description="Finished appointments"
        icon={CheckCircle2}
        href="/doctor/appointments?status=completed"
      />
    </div>
  );
}

