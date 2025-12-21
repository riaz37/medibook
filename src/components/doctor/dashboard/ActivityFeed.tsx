import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Clock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { requireAuth } from "@/lib/server/rbac";
import prisma from "@/lib/prisma";
import { format, parseISO, differenceInDays } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

async function ActivityFeed() {
  const authResult = await requireAuth();
  let recentAppointments: any[] = [];

  if ("response" in authResult) {
    // If auth fails, return empty state (component will show "No recent activity")
  } else {
    const { context } = authResult;
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: context.clerkUserId },
        include: { doctorProfile: true },
      });

      if (user?.doctorProfile) {
        const dbAppointments = await prisma.appointment.findMany({
          where: { doctorId: user.doctorProfile.id },
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        });

        recentAppointments = dbAppointments;
      }
    } catch (error) {
      console.error("Error fetching recent activities for activity feed:", error);
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const daysDiff = differenceInDays(now, date);

    if (daysDiff === 0) return "Today";
    if (daysDiff === 1) return "Yesterday";
    if (daysDiff < 7) return `${daysDiff} days ago`;
    return format(date, "MMM d");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "COMPLETED":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "CANCELLED":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest appointments and updates</CardDescription>
        </div>
        <Link href="/doctor/appointments">
          <Button variant="ghost" size="sm">
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {recentAppointments.length > 0 ? (
          <div className="space-y-4">
            {recentAppointments.map((appointment) => {
              const patientName = `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim() || "Patient";
              const appointmentDate = appointment.date;
              
              let Icon = Calendar;
              let title = `Appointment with ${patientName}`;
              
              if (appointment.status === "PENDING") {
                Icon = AlertCircle;
                title = `New appointment request from ${patientName}`;
              } else if (appointment.status === "CONFIRMED") {
                Icon = CheckCircle2;
                title = `Appointment confirmed with ${patientName}`;
              } else if (appointment.status === "COMPLETED") {
                Icon = CheckCircle2;
                title = `Appointment completed with ${patientName}`;
              }

              return (
                <div
                  key={appointment.id}
                  className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{title}</p>
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
                    {getTimeAgo(appointment.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Clock}
            title="No recent activity"
            description="Your appointment activity will appear here once you have appointments."
          />
        )}
      </CardContent>
    </Card>
  );
}

export default ActivityFeed;

