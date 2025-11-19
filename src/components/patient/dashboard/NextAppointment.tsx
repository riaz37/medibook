import { format, isAfter, isSameDay, parseISO, isPast, differenceInDays, differenceInHours } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarIcon, ClockIcon, ArrowRight } from "lucide-react";
import { getAuthContext } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Appointment = {
  id: string;
  date: string;
  time: string;
  status: string;
  reason?: string;
  doctorName: string;
  doctorImageUrl?: string;
  patientName: string;
  patientEmail: string;
};

function transformAppointment(appointment: any): Appointment {
  return {
    ...appointment,
    patientName: `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim(),
    patientEmail: appointment.user.email,
    doctorName: appointment.doctor.name,
    doctorImageUrl: appointment.doctor.imageUrl || "",
    date: appointment.date.toISOString().split("T")[0],
  };
}

async function NextAppointment() {
  // Middleware ensures user is authenticated
  const context = await getAuthContext();
  let appointments: Appointment[] = [];

  if (context) {
    try {
      // Get DB user ID from Clerk user ID
      const user = await prisma.user.findUnique({
        where: { clerkId: context.clerkUserId },
      });

      if (user) {
        const dbAppointments = await prisma.appointment.findMany({
          where: { userId: user.id },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            doctor: { select: { name: true, imageUrl: true } },
          },
          orderBy: [{ date: "asc" }, { time: "asc" }],
        });

        appointments = dbAppointments.map(transformAppointment);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  }

  // Calculate stats
  const today = new Date();
  const upcomingAppointments = appointments?.filter((appointment: Appointment) => {
    const appointmentDate = parseISO(appointment.date);
    const isUpcoming = isSameDay(appointmentDate, today) || isAfter(appointmentDate, today);
    return isUpcoming && (appointment.status === "CONFIRMED" || appointment.status === "PENDING");
  }) || [];

  const completedAppointments = appointments?.filter((appointment: Appointment) => {
    const appointmentDate = parseISO(appointment.date);
    const isAppointmentPast = isPast(appointmentDate) && !isSameDay(appointmentDate, today);
    return appointment.status === "COMPLETED" || (isAppointmentPast && appointment.status === "CONFIRMED");
  }) || [];

  // get the next appointment (earliest upcoming one)
  const nextAppointment = upcomingAppointments[0];

  const appointmentDate = nextAppointment ? parseISO(nextAppointment.date) : null;
  const formattedDate = appointmentDate ? format(appointmentDate, "EEEE, MMMM d, yyyy") : "";
  const isToday = appointmentDate ? isSameDay(appointmentDate, new Date()) : false;
  
  // Calculate countdown
  const getCountdown = () => {
    if (!appointmentDate) return null;
    const now = new Date();
    const days = differenceInDays(appointmentDate, now);
    const hours = differenceInHours(appointmentDate, now);
    
    if (isToday) {
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

  const countdown = getCountdown();
  
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
    <Card data-tour="appointments" className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="size-5 text-primary" />
              Appointments
            </CardTitle>
            <CardDescription>Quick overview of your appointments</CardDescription>
          </div>
          <Link href="/patient/appointments">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Next Appointment Preview */}
        {nextAppointment ? (
          <div className="p-5 bg-gradient-to-br from-primary/5 to-muted/30 rounded-xl border border-primary/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Next Appointment</p>
                {countdown && (
                  <Badge variant="outline" className="text-xs font-semibold">
                    {countdown}
                  </Badge>
                )}
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${getStatusColor(nextAppointment.status)}`}
              >
                {nextAppointment.status}
              </Badge>
            </div>
            
            <div className="space-y-4">
              {/* Doctor Info */}
              <div className="flex items-center gap-3">
                <Avatar className="size-12 border-2 border-primary/20">
                  <AvatarImage src={nextAppointment.doctorImageUrl} alt={nextAppointment.doctorName} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {nextAppointment.doctorName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-base">{nextAppointment.doctorName}</p>
                  <p className="text-xs text-muted-foreground">{nextAppointment.reason || "Appointment"}</p>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                  <CalendarIcon className="size-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{formattedDate}</p>
                    <p className="text-xs text-muted-foreground">
                      {isToday ? "Today" : format(appointmentDate!, "EEEE")}
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
                <p className="text-xs text-muted-foreground mb-4">
                  Book your first appointment to get started
                </p>
              </div>
              <Link href="/patient/appointments/book">
                <Button size="sm">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Book Now
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Link href="/patient/appointments" className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default NextAppointment;
