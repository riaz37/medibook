import { StatCard } from "@/components/ui/stat-card";
import { Calendar, CheckCircle2, List, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/server/auth-utils";
import { isAfter, isSameDay } from "date-fns";

async function getDoctorStats(doctorId: string) {
  try {
    const today = new Date();
    const appointments = await prisma.appointment.findMany({
      where: { doctorId },
      select: { date: true, status: true },
    });

    const total = appointments.length;
    const pending = appointments.filter((apt) => apt.status === "PENDING").length;
    const upcoming = appointments.filter((appointment) => {
      const appointmentDate = appointment.date;
      const isUpcoming = isSameDay(appointmentDate, today) || isAfter(appointmentDate, today);
      return isUpcoming && (appointment.status === "CONFIRMED" || appointment.status === "PENDING");
    }).length;
    const completed = appointments.filter((apt) => apt.status === "COMPLETED").length;

    return { total, pending, upcoming, completed };
  } catch {
    return { total: 0, pending: 0, upcoming: 0, completed: 0 };
  }
}

export default async function DoctorStatsGrid() {
  const context = await getAuthContext();
  let stats = { total: 0, pending: 0, upcoming: 0, completed: 0 };

  if (context) {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: context.clerkUserId },
        include: { doctorProfile: true },
      });
      if (user?.doctorProfile) {
        stats = await getDoctorStats(user.doctorProfile.id);
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

