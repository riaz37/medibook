import { StatCard } from "@/components/ui/stat-card";
import { Calendar, CheckCircle2, List, Mic } from "lucide-react";
import { appointmentsService } from "@/lib/services";
import { requireAuth } from "@/lib/server/rbac";
import prisma from "@/lib/prisma";
import { getUpcomingAppointmentCount } from "@/lib/utils/appointments";

export default async function StatsGrid() {
  const stats = await appointmentsService.getStats();
  const authResult = await requireAuth();
  
  let upcomingCount = 0;

  if ("response" in authResult) {
    // If auth fails, still render stats with 0 for upcoming count
    // Component can still display other stats
  } else {
    const { context } = authResult;
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: context.clerkUserId },
        select: { id: true },
      });
      if (user) {
        upcomingCount = await getUpcomingAppointmentCount(user.id);
      }
    } catch (error) {
      // Error is handled silently for server components - could add error logging service here
    }
  }

  return (
    <div data-tour="stats-grid" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <StatCard
        title="Total Appointments"
        value={stats.totalAppointments || 0}
        description="All time appointments"
        icon={List}
        href="/patient/appointments"
      />
      <StatCard
        title="Upcoming"
        value={upcomingCount}
        description="Scheduled appointments"
        icon={Calendar}
        href="/patient/appointments?tab=upcoming"
      />
      <StatCard
        title="Completed"
        value={stats.completedAppointments || 0}
        description="Past appointments"
        icon={CheckCircle2}
        href="/patient/appointments?tab=completed"
      />
      <StatCard
        title="AI Sessions"
        value="0"
        description="Voice assistant usage"
        icon={Mic}
        href="/patient/voice"
      />
    </div>
  );
}

