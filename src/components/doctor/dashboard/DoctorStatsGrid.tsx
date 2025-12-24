import { StatCard } from "@/components/shared/cards/StatCard";
import { Calendar, AlertCircle } from "lucide-react";
import { requireAuth } from "@/lib/server/rbac";
import { getDoctorStats } from "@/lib/utils/appointments";

export default async function DoctorStatsGrid() {
  const authResult = await requireAuth();
  let stats = { total: 0, pending: 0, upcoming: 0, completed: 0 };

  if ("response" in authResult) {
    // If auth fails, return default stats
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      <StatCard
        title="Pending Appointments"
        value={stats.pending}
        description="Awaiting your confirmation"
        icon={AlertCircle}
        href="/doctor/appointments?status=pending"
      />
      <StatCard
        title="Upcoming This Week"
        value={stats.upcoming}
        description="Scheduled appointments"
        icon={Calendar}
        href="/doctor/appointments?status=upcoming"
      />
    </div>
  );
}
