import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { UsersIcon, CheckCircle2Icon } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getPendingVerifications = unstable_cache(
  async () => {
    try {
      const count = await prisma.doctorVerification.count({
        where: { status: "PENDING" },
      });
      return count;
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      return 0;
    }
  },
  ["pending-verifications"],
  { revalidate: 60, tags: ["pending-verifications", "admin-stats"] }
);

export default async function AdminDashboardHero() {
  const user = await getCurrentUser();
  const pendingVerifications = await getPendingVerifications();

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
          <div className="size-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-primary">Admin Dashboard</span>
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {getGreeting()}, {user?.firstName || "Admin"}!
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage doctors, oversee appointments, and monitor your practice performance. Keep everything running smoothly.
          </p>
        </div>

        {pendingVerifications > 0 && (
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-orange-600">{pendingVerifications}</div>
              <div className="text-sm text-muted-foreground">Pending Verifications</div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-4">
          <Link href="/admin/doctors">
            <Button size="lg" variant="default">
              <UsersIcon className="w-4 h-4 mr-2" />
              Manage Doctors
            </Button>
          </Link>
          {pendingVerifications > 0 && (
            <Link href="/admin/verifications">
              <Button size="lg" variant="outline">
                <CheckCircle2Icon className="w-4 h-4 mr-2" />
                Review Verifications ({pendingVerifications})
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center size-24 md:size-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mt-4 md:mt-0 md:ml-8">
        <Image src="/logo.png" alt="Medibook" width={64} height={64} className="w-16 h-16" />
      </div>
    </div>
  );
}

