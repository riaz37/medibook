import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CalendarIcon, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/server/rbac";
import { getCurrentUser } from "@/lib/auth";
import { format } from "date-fns";

export default async function DoctorDashboardHero() {
  const user = await getCurrentUser();
  const authResult = await requireAuth();
  
  let doctor = null;
  let isVerified = false;

  if ("response" in authResult) {
    // If auth fails, return null (component won't render)
    return null;
  }

  const { context } = authResult;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: context.userId },
      include: { doctorProfile: true },
    });

    if (dbUser?.doctorProfile) {
      doctor = dbUser.doctorProfile;
      isVerified = doctor.isVerified;
    }
  } catch (error) {
    console.error("Error fetching doctor data:", error);
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const today = new Date();
  const dayOfWeek = format(today, "EEEE");
  const dateStr = format(today, "MMMM d, yyyy");

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
      <div className="space-y-3 flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 w-fit">
            {isVerified ? (
              <>
                <CheckCircle2 className="size-3 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Verified Doctor
                </span>
              </>
            ) : (
              <>
                <Clock className="size-3 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-600">
                  Verification Pending
                </span>
              </>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {dayOfWeek}, {dateStr}
          </div>
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {getGreeting()}, {doctor?.name || user?.firstName}!
          </h1>
        </div>
      </div>

      <div className="mt-4 md:mt-0">
        <Link href="/doctor/appointments">
          <Button size="lg" variant="default">
            <CalendarIcon className="w-4 h-4 mr-2" />
            View Today's Schedule
          </Button>
        </Link>
      </div>
    </div>
  );
}
