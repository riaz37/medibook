import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Stethoscope } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { format } from "date-fns";

export default async function DashboardHero() {
  const user = await getCurrentUser();

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
            <div className="size-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-primary">Online & Ready</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {dayOfWeek}, {dateStr}
          </div>
        </div>
        
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {getGreeting()}, {user?.firstName}!
          </h1>
        </div>
      </div>

      <div className="mt-4 md:mt-0">
        <Link href="/patient/appointments?tab=find-book">
          <Button size="lg" variant="default">
            <Stethoscope className="w-4 h-4 mr-2" />
            Find & Book Doctor
          </Button>
        </Link>
      </div>
    </div>
  );
}
