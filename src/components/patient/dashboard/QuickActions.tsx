import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { requireAuth } from "@/lib/server/rbac";
import prisma from "@/lib/prisma";
import { getUpcomingAppointmentCount } from "@/lib/utils/appointments";

export default async function QuickActions() {
  const authResult = await requireAuth();
  let hasAppointments = false;

  if (!("response" in authResult)) {
    const { context } = authResult;
    try {
      const upcomingCount = await getUpcomingAppointmentCount(context.userId);
      hasAppointments = upcomingCount > 0;
    } catch (error) {
      // Error handled silently
    }
  }

  const actions = [
    {
      title: "Find & Book Doctor",
      description: "Search and book appointments with verified healthcare professionals",
      icon: Stethoscope,
      href: "/patient/appointments?tab=find-book",
      primary: true,
      image: "/logo.png",
    },
    ...(hasAppointments
      ? [
          {
            title: "My Appointments",
            description: "View and manage your upcoming and past appointments",
            icon: Calendar,
            href: "/patient/appointments?tab=my-appointments",
            primary: false,
          },
        ]
      : []),
  ];

  return (
    <div className={`grid grid-cols-1 ${hasAppointments ? "md:grid-cols-2" : "md:grid-cols-1"} gap-4 mb-8`}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Card
            key={action.title}
            className={`relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-2 ${
              action.primary
                ? "border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5"
                : "hover:border-primary/20"
            }`}
          >
            {action.primary && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
            <CardHeader className="relative pb-3">
              <div className="flex items-start justify-between mb-2">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    action.primary
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  } group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                {action.primary && action.image && (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 p-1.5 opacity-60">
                    <Image
                      src={action.image}
                      alt=""
                      width={20}
                      height={20}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
              <CardTitle className="text-lg font-semibold">{action.title}</CardTitle>
              <CardDescription className="text-sm mt-1 line-clamp-2">
                {action.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative pt-0">
              <Link href={action.href}>
                <Button
                  variant={action.primary ? "default" : "outline"}
                  className={`w-full ${
                    action.primary
                      ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      : ""
                  }`}
                >
                  {action.primary ? "Get Started" : "View"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
