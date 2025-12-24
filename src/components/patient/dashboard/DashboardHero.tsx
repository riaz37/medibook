import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import Link from "next/link";

export default async function DashboardHero() {
  const user = await getCurrentUser();

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
          <span className="text-sm font-medium text-primary">Online & Ready</span>
        </div>
        
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {getGreeting()}, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Book doctor appointments and get instant advice. Your personal AI healthcare assistant is ready to help you maintain your health.
          </p>
        </div>

        <Link href="/patient/appointments/book">
          <Button size="lg" className="mt-4">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        </Link>
      </div>

      <div className="hidden lg:flex items-center justify-center size-24 md:size-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mt-4 md:mt-0 md:ml-8">
        <Image src="/logo.png" alt="Medibook" width={64} height={64} className="w-16 h-16" />
      </div>
    </div>
  );
}

