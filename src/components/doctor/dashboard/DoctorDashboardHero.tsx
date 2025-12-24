import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CalendarIcon, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/server/rbac";
import { getCurrentUser } from "@/lib/auth";

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

  return (
    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-3xl p-6 md:p-8 border border-primary/20 mb-8 overflow-hidden">
      <div className="space-y-4 flex-1">
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

        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {getGreeting()}, {doctor?.name || user?.firstName}!
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage your appointments, patients, and practice settings. Stay on
            top of your schedule and provide the best care.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Link href="/doctor/appointments">
            <Button size="lg" variant="default">
              <CalendarIcon className="w-4 h-4 mr-2" />
              View Appointments
            </Button>
          </Link>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center size-24 md:size-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mt-4 md:mt-0 md:ml-8">
        <Image
          src="/logo.png"
          alt="Medibook"
          width={64}
          height={64}
          className="w-16 h-16"
        />
      </div>
    </div>
  );
}
