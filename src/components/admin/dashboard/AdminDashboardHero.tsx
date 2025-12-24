import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { format } from "date-fns";

const getPendingCount = unstable_cache(
  async () => {
    try {
      const [pendingVerifications, pendingApplications] = await Promise.all([
        prisma.doctorVerification.count({
          where: { status: "PENDING" },
        }),
        prisma.doctorApplication.count({
          where: { status: "PENDING" },
        }),
      ]);
      return pendingVerifications + pendingApplications;
    } catch (error) {
      console.error("Error fetching pending count:", error);
      return 0;
    }
  },
  ["pending-count"],
  { revalidate: 60, tags: ["pending-verifications", "admin-stats"] }
);

export default async function AdminDashboardHero() {
  const user = await getCurrentUser();
  const pendingCount = await getPendingCount();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const today = new Date();
  const dateStr = format(today, "EEEE, MMMM d");

  return (
    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-3xl p-6 md:p-8 border border-primary/20 mb-8 overflow-hidden">
      <div className="space-y-6 flex-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 w-fit">
          <div className="size-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-primary">Admin Dashboard</span>
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {getGreeting()}, {user?.firstName || "Admin"}!
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Today is {dateStr}. Monitor and manage your platform.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/admin/verifications">
              <Button size="lg" className="w-full sm:w-auto">
                <CheckCircle2Icon className="w-4 h-4 mr-2" />
                Review Verifications ({pendingCount})
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="hidden lg:flex items-center justify-center size-24 md:size-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mt-4 md:mt-0 md:ml-8">
        <Image src="/logo.png" alt="Medibook" width={64} height={64} className="w-16 h-16" />
      </div>
    </div>
  );
}

