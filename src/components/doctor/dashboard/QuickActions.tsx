import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Users, Settings, Clock, Wallet } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function QuickActions() {
  const actions = [
    {
      title: "Today's Schedule",
      description: "View and manage today's appointments",
      icon: Calendar,
      href: "/doctor/appointments",
      primary: true,
      color: "from-blue-500/20 to-blue-500/10",
      iconColor: "text-blue-600",
    },
    {
      title: "Create Prescription",
      description: "Write a new prescription for a patient",
      icon: FileText,
      href: "/doctor/prescriptions/create",
      primary: false,
      color: "from-green-500/20 to-green-500/10",
      iconColor: "text-green-600",
    },
    {
      title: "All Appointments",
      description: "View calendar and manage all appointments",
      icon: Clock,
      href: "/doctor/appointments",
      primary: false,
      color: "from-purple-500/20 to-purple-500/10",
      iconColor: "text-purple-600",
    },
    {
      title: "Billing & Payments",
      description: "View earnings and payment history",
      icon: Wallet,
      href: "/doctor/billing",
      primary: false,
      color: "from-orange-500/20 to-orange-500/10",
      iconColor: "text-orange-600",
    },
    {
      title: "Settings",
      description: "Manage availability and practice settings",
      icon: Settings,
      href: "/doctor/settings",
      primary: false,
      color: "from-gray-500/20 to-gray-500/10",
      iconColor: "text-gray-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${action.color} group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className={`w-6 h-6 ${action.iconColor}`} />
              </div>
              <CardTitle className="text-base font-semibold">{action.title}</CardTitle>
              <CardDescription className="text-xs mt-1 line-clamp-2">
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
                  size="sm"
                >
                  {action.primary ? "View Now" : "Open"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

