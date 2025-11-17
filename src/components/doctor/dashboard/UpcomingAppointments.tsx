import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon, ArrowRight, User, Mail, Phone } from "lucide-react";
import { getAuthContext } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import { format, isAfter, isSameDay, parseISO, differenceInDays, differenceInHours } from "date-fns";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Appointment = {
  id: string;
  date: Date;
  time: string;
  status: string;
  reason?: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
};

async function UpcomingAppointments() {
  const context = await getAuthContext();
  let appointments: Appointment[] = [];

  if (context) {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: context.clerkUserId },
        include: { doctorProfile: true },
      });

      if (user?.doctorProfile) {
        const dbAppointments = await prisma.appointment.findMany({
          where: {
            doctorId: user.doctorProfile.id,
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: [{ date: "asc" }, { time: "asc" }],
          take: 5,
        });

        appointments = dbAppointments.map((apt) => ({
          ...apt,
          date: apt.date,
          reason: apt.reason ?? undefined,
        }));
      }
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error);
    }
  }

  const today = new Date();
  const upcomingAppointments = appointments.filter((appointment) => {
    const appointmentDate = appointment.date;
    const isUpcoming = isSameDay(appointmentDate, today) || isAfter(appointmentDate, today);
    return isUpcoming && (appointment.status === "CONFIRMED" || appointment.status === "PENDING");
  });

  const nextAppointment = upcomingAppointments[0];

  const getCountdown = (date: Date) => {
    const now = new Date();
    const days = differenceInDays(date, now);
    const hours = differenceInHours(date, now);

    if (isSameDay(date, now)) {
      return "Today";
    } else if (days === 1) {
      return "Tomorrow";
    } else if (days > 0) {
      return `In ${days} day${days > 1 ? "s" : ""}`;
    } else if (hours > 0) {
      return `In ${hours} hour${hours > 1 ? "s" : ""}`;
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="size-5 text-primary" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription>Your next scheduled appointments</CardDescription>
          </div>
          <Link href="/doctor/appointments">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {nextAppointment ? (
          <div className="p-5 bg-gradient-to-br from-primary/5 to-muted/30 rounded-xl border border-primary/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Next Appointment</p>
                {getCountdown(nextAppointment.date) && (
                  <Badge variant="outline" className="text-xs font-semibold">
                    {getCountdown(nextAppointment.date)}
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className={`text-xs ${getStatusColor(nextAppointment.status)}`}>
                {nextAppointment.status}
              </Badge>
            </div>

            <div className="space-y-4">
              {/* Patient Info */}
              <div className="flex items-center gap-3">
                <Avatar className="size-12 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {nextAppointment.user.firstName?.charAt(0) || "P"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-base">
                    {nextAppointment.user.firstName} {nextAppointment.user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{nextAppointment.reason || "Appointment"}</p>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                  <CalendarIcon className="size-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{format(nextAppointment.date, "EEEE, MMMM d, yyyy")}</p>
                    <p className="text-xs text-muted-foreground">
                      {isSameDay(nextAppointment.date, today) ? "Today" : format(nextAppointment.date, "EEEE")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                  <ClockIcon className="size-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{nextAppointment.time}</p>
                    <p className="text-xs text-muted-foreground">Local time</p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="size-3" />
                  <span>{nextAppointment.user.email}</span>
                </div>
                {nextAppointment.user.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="size-3" />
                    <span>{nextAppointment.user.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* More Appointments Count */}
            {upcomingAppointments.length > 1 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-center text-muted-foreground">
                  +{upcomingAppointments.length - 1} more upcoming appointment
                  {upcomingAppointments.length > 2 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 bg-muted/30 rounded-xl border text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="size-12 bg-muted rounded-full flex items-center justify-center">
                <CalendarIcon className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">No upcoming appointments</p>
                <p className="text-xs text-muted-foreground">
                  Your schedule is clear for now
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Link href="/doctor/appointments" className="flex-1">
            <Button className="w-full" size="sm">
              <CalendarIcon className="w-4 h-4 mr-2" />
              View All
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default UpcomingAppointments;

