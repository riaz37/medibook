import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { CalendarIcon, SettingsIcon, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/server/auth-utils";
import { isAfter, isSameDay, parseISO } from "date-fns";

async function getDoctorStats(doctorId: string) {
  try {
    const today = new Date();
    const appointments = await prisma.appointment.findMany({
      where: { doctorId },
      select: { date: true, status: true },
    });

    const pending = appointments.filter((apt) => apt.status === "PENDING").length;
    const upcoming = appointments.filter((appointment) => {
      const appointmentDate = appointment.date;
      const isUpcoming = isSameDay(appointmentDate, today) || isAfter(appointmentDate, today);
      return isUpcoming && (appointment.status === "CONFIRMED" || appointment.status === "PENDING");
    }).length;

    return { pending, upcoming };
  } catch {
    return { pending: 0, upcoming: 0 };
  }
}

export default async function DoctorDashboardHero() {
  const user = await currentUser();
  const context = await getAuthContext();
  let doctor = null;
  let stats = { pending: 0, upcoming: 0 };
  let isVerified = false;

  if (context) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: context.clerkUserId },
        include: { doctorProfile: true },
      });

      if (dbUser?.doctorProfile) {
        doctor = dbUser.doctorProfile;
        isVerified = doctor.isVerified;
        stats = await getDoctorStats(doctor.id);
      }
    } catch (error) {
      console.error("Error fetching doctor data:", error);
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
          {isVerified ? (
            <>
              <CheckCircle2 className="size-3 text-primary" />
              <span className="text-sm font-medium text-primary">Verified Doctor</span>
            </>
          ) : (
            <>
              <Clock className="size-3 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600">Verification Pending</span>
            </>
          )}
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {getGreeting()}, {doctor?.name || user?.firstName}!
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage your appointments, patients, and practice settings. Stay on top of your schedule and provide the best care.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-primary">{stats.upcoming}</div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </div>
          {stats.pending > 0 && (
            <>
              <div className="h-4 w-px bg-border"></div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Link href="/doctor/appointments">
            <Button size="lg" variant="default">
              <CalendarIcon className="w-4 h-4 mr-2" />
              View Appointments
            </Button>
          </Link>
          <Link href="/doctor/settings">
            <Button size="lg" variant="outline">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center size-24 md:size-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mt-4 md:mt-0 md:ml-8">
        <Image src="/logo.png" alt="Medibook" width={64} height={64} className="w-16 h-16" />
      </div>
    </div>
  );
}

