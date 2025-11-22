import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle2, Clock, ArrowRight, UserPlus } from "lucide-react";
import { getAuthContext } from "@/lib/server/auth-utils";
import prisma from "@/lib/prisma";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

async function RecentActivity() {
  const context = await getAuthContext();
  let recentActivities: any[] = [];

  if (context) {
    try {
      // Get recent verifications
      const verifications = await (prisma as any).doctorVerification?.findMany({
        where: { status: "PENDING" },
        include: {
          doctor: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 3,
      }).catch(() => []);

      // Get recent appointments
      const appointments = await prisma.appointment.findMany({
        include: {
          user: { select: { firstName: true, lastName: true } },
          doctor: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      });

      // Get recently added doctors
      const recentDoctors = await prisma.doctor.findMany({
        orderBy: { createdAt: "desc" },
        take: 2,
        select: {
          id: true,
          name: true,
          createdAt: true,
          isVerified: true,
        },
      });

      recentActivities = [
        ...(verifications || []).map((v: any) => ({
          id: v.id,
          type: "verification",
          title: `New verification request from ${v.doctor.name}`,
          description: "Pending review",
          timestamp: v.submittedAt || v.createdAt,
          icon: CheckCircle2,
          href: "/admin/verifications",
        })),
        ...appointments.slice(0, 2).map((apt) => ({
          id: apt.id,
          type: "appointment",
          title: `New appointment: ${apt.user.firstName} ${apt.user.lastName} with Dr. ${apt.doctor.name}`,
          description: apt.reason || "Appointment",
          timestamp: apt.createdAt,
          icon: Calendar,
          href: "/admin/appointments",
        })),
        ...recentDoctors.map((doc) => ({
          id: doc.id,
          type: "doctor",
          title: `New doctor: ${doc.name}`,
          description: doc.isVerified ? "Verified" : "Pending verification",
          timestamp: doc.createdAt,
          icon: UserPlus,
          href: "/admin/doctors",
        })),
      ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest system events and updates</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {recentActivities.length > 0 ? (
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-1">{activity.title}</p>
                    <p className="text-xs text-muted-foreground mb-1">{activity.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{getTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="size-12 bg-muted rounded-full flex items-center justify-center">
                <Clock className="size-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">No recent activity</h3>
                <p className="text-xs text-muted-foreground">
                  System activity and updates will appear here as they occur.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentActivity;

