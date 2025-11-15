import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import Link from "next/link";
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

export default async function DashboardHero() {
  const user = await currentUser();
  const stats = await appointmentsService.getStats();
  const context = await getAuthContext();
  let upcomingCount = 0;

  if (context) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: context.clerkUserId },
        select: { id: true },
      });
      if (dbUser) {
        upcomingCount = await getUpcomingCount(dbUser.id);
      }
    } catch (error) {
      console.error("Error fetching upcoming count:", error);
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-3xl p-6 md:p-8 border border-primary/20 mb-8 overflow-hidden">
      <div className="space-y-4 flex-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 w-fit">
          <div className="size-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-primary">Online & Ready</span>
        </div>
        
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {getGreeting()}, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Book doctor appointments and get instant advice. Your personal AI healthcare assistant is ready to help you maintain your health.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-primary">{upcomingCount}</div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </div>
          <div className="h-4 w-px bg-border"></div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-primary">{stats.completedAppointments || 0}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="h-4 w-px bg-border"></div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-primary">{stats.totalAppointments || 0}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>

        <Link href="/patient/appointments/book">
          <Button size="lg" className="mt-4">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        </Link>
      </div>

      <div className="hidden lg:flex items-center justify-center size-24 md:size-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mt-4 md:mt-0 md:ml-8">
        <Image src="/logo.png" alt="Medibook" width={64} height={64} className="w-16 h-16" />
      </div>
    </div>
  );
}

