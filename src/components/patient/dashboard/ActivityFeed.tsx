import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";
import { getAuthContext } from "@/lib/server/auth-utils";
import prisma from "@/lib/prisma";
import { format, parseISO, isToday, isAfter, differenceInDays } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardAppointment } from "@/lib/types";

function transformAppointment(appointment: any): DashboardAppointment {
  return {
    ...appointment,
    doctorName: appointment.doctor.name,
    doctorImageUrl: appointment.doctor.imageUrl || "",
    date: appointment.date.toISOString().split("T")[0],
  };
}

export default async function ActivityFeed() {
  const context = await getAuthContext();
  let recentAppointments: DashboardAppointment[] = [];

  if (context) {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: context.clerkUserId },
      });

      if (user) {
        const dbAppointments = await prisma.appointment.findMany({
          where: { userId: user.id },
          include: {
            doctor: { select: { name: true, imageUrl: true } },
          },
          orderBy: [{ date: "desc" }, { time: "desc" }],
          take: 5,
        });

        recentAppointments = dbAppointments.map(transformAppointment);
      }
    } catch (error) {
      // Error is handled silently for server components - could add error logging service here
    }
  }

  const getTimeAgo = (date: string) => {
    const appointmentDate = parseISO(date);
    const now = new Date();
    const daysDiff = differenceInDays(now, appointmentDate);

    if (daysDiff === 0) return "Today";
    if (daysDiff === 1) return "Yesterday";
    if (daysDiff < 7) return `${daysDiff} days ago`;
    return format(appointmentDate, "MMM d");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "COMPLETED":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "CANCELLED":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card data-tour="activity">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest appointments and activities</CardDescription>
          </div>
          <Link href="/patient/appointments">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {recentAppointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No recent activity"
            description="Your appointment activity will appear here once you book appointments."
            action={{
              label: "Book Your First Appointment",
              href: "/patient/appointments/book",
            }}
          />
        ) : (
          <div className="space-y-4">
            {recentAppointments.map((appointment) => {
              const appointmentDate = parseISO(appointment.date);
              const isUpcoming = isToday(appointmentDate) || isAfter(appointmentDate, new Date());

              return (
                <div
                  key={appointment.id}
                  className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <Calendar className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{appointment.doctorName}</p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(appointment.status)}`}
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {appointment.reason || "Appointment"}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {format(appointmentDate, "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {appointment.time}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {getTimeAgo(appointment.date)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

