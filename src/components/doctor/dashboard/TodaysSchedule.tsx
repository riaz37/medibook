import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, ArrowRight, User, Mail, Phone, CheckCircle2, XCircle } from "lucide-react";
import { requireAuth } from "@/lib/server/rbac";
import prisma from "@/lib/prisma";
import { format, isSameDay, parseISO } from "date-fns";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";

interface TodaysAppointment {
  id: string;
  date: Date;
  time: string;
  status: string;
  reason: string | null;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
}

async function getTodaysAppointments(doctorId: string): Promise<TodaysAppointment[]> {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["CONFIRMED", "PENDING", "COMPLETED"],
        },
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
      orderBy: [{ time: "asc" }],
    });

    return appointments.map((apt) => ({
      id: apt.id,
      date: apt.date,
      time: apt.time,
      status: apt.status,
      reason: apt.reason,
      user: apt.user,
    }));
  } catch {
    return [];
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "CONFIRMED":
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Confirmed</Badge>;
    case "PENDING":
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
    case "COMPLETED":
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
    case "CANCELLED":
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default async function TodaysSchedule() {
  const authResult = await requireAuth();
  let appointments: TodaysAppointment[] = [];
  let doctorId: string | null = null;

  if ("response" in authResult) {
    // If auth fails, return empty state
  } else {
    const { context } = authResult;
    if (context.doctorId) {
      doctorId = context.doctorId;
      appointments = await getTodaysAppointments(context.doctorId);
    }
  }

  const confirmedAppointments = appointments.filter((apt) => apt.status === "CONFIRMED" || apt.status === "PENDING");
  const completedAppointments = appointments.filter((apt) => apt.status === "COMPLETED");

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="size-5 text-primary" />
              Today's Schedule
            </CardTitle>
            <CardDescription>
              {appointments.length > 0
                ? `${confirmedAppointments.length} upcoming, ${completedAppointments.length} completed`
                : "No appointments scheduled for today"}
            </CardDescription>
          </div>
          <Link href="/doctor/appointments">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="No appointments today"
            description="Your schedule is clear for today. Check upcoming appointments or update your availability."
            action={{
              label: "View All Appointments",
              href: "/doctor/appointments",
            }}
          />
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const patientName = `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim() || "Patient";
              const initials = `${appointment.user.firstName?.[0] || ""}${appointment.user.lastName?.[0] || ""}` || "P";

              return (
                <div
                  key={appointment.id}
                  className="flex items-start gap-4 p-4 bg-background/50 rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
                >
                  {/* Time Column */}
                  <div className="flex flex-col items-center min-w-[80px]">
                    <div className="text-lg font-bold text-primary">{appointment.time}</div>
                    <div className="text-xs text-muted-foreground">Today</div>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-full bg-border min-h-[60px]" />

                  {/* Appointment Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="size-10 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{patientName}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {appointment.reason || "Appointment"}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="size-3" />
                        <span className="truncate max-w-[200px]">{appointment.user.email}</span>
                      </div>
                      {appointment.user.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="size-3" />
                          <span>{appointment.user.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    {appointment.status !== "COMPLETED" && appointment.status !== "CANCELLED" && (
                      <div className="flex gap-2 mt-3">
                        <Link href={`/doctor/appointments/${appointment.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        {appointment.status === "PENDING" && (
                          <Link href={`/doctor/prescriptions/create?appointmentId=${appointment.id}`}>
                            <Button variant="outline" size="sm">
                              Create Prescription
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
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

