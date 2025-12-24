import { StatCard } from "@/components/shared/cards/StatCard";
import { Calendar } from "lucide-react";
import { requireAuth } from "@/lib/server/rbac";
import { getUpcomingAppointmentCount } from "@/lib/utils/appointments";

export default async function StatsGrid() {
  const authResult = await requireAuth();
  
  let upcomingCount = 0;

  if (!("response" in authResult)) {
    const { context } = authResult;
    try {
      // Get upcoming appointments count
      upcomingCount = await getUpcomingAppointmentCount(context.userId);
    } catch (error) {
      // Error is handled silently for server components
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-8">
      <StatCard
        title="Upcoming Appointments"
        value={upcomingCount}
        description="Scheduled appointments"
        icon={Calendar}
        href="/patient/appointments?tab=my-appointments&filter=upcoming"
      />
    </div>
  );
}
