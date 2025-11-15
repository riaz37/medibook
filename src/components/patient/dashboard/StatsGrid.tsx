import { StatCard } from "@/components/ui/stat-card";
import { Calendar, CheckCircle2, List, Mic } from "lucide-react";
import { appointmentsService } from "@/lib/services";
import { getAuthContext } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import { isAfter, isSameDay } from "date-fns";

async function getUpcomingCount(userId: string): Promise<number> {
  try {
    const today = new Date();
    const appointments = await prisma.appointment.findMany({
      where: { userId },
      select: { date: true, status: true },
    });

    return appointments.filter((appointment) => {
      const appointmentDate = appointment.date;
      const isUpcoming = isSameDay(appointmentDate, today) || isAfter(appointmentDate, today);
      return isUpcoming && (appointment.status === "CONFIRMED" || appointment.status === "PENDING");
    }).length;
  } catch {
    return 0;
  }
}

export default async function StatsGrid() {
  const stats = await appointmentsService.getStats();
  const context = await getAuthContext();
  let upcomingCount = 0;

  if (context) {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: context.clerkUserId },
        select: { id: true },
      });
      if (user) {
        upcomingCount = await getUpcomingCount(user.id);
      }
    } catch (error) {
      console.error("Error fetching upcoming count:", error);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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

