"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle2, Calendar, Settings, Plus } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import AddDoctorDialog from "@/components/admin/AddDoctorDialog";

export default function QuickActions() {
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);

  const actions = [
    {
      title: "Add Doctor",
      description: "Register a new doctor to the platform",
      icon: Plus,
      onClick: () => setIsAddDoctorOpen(true),
      color: "text-primary",
    },
    {
      title: "View Doctors",
      description: "Manage all registered doctors",
      icon: Users,
      href: "/admin/users",
      color: "text-blue-600",
    },
    {
      title: "Verifications",
      description: "Review pending doctor verifications",
      icon: CheckCircle2,
      href: "/admin/verifications",
      color: "text-orange-600",
    },
    {
      title: "Appointments",
      description: "View all appointments",
      icon: Calendar,
      href: "/admin/appointments",
      color: "text-green-600",
    },
    {
      title: "Settings",
      description: "Configure system settings",
      icon: Settings,
      href: "#",
      disabled: true,
      color: "text-muted-foreground",
    },
  ];

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {actions.map((action) => {
          const Icon = action.icon;
          const cardContent = (
            <Card
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                action.disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={action.disabled ? undefined : action.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{action.title}</CardTitle>
                <Icon className={`h-4 w-4 ${action.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          );

          if (action.href && !action.disabled && !action.onClick) {
            return (
              <Link key={action.title} href={action.href} className="block">
                {cardContent}
              </Link>
            );
          }

          return <div key={action.title}>{cardContent}</div>;
        })}
      </div>

      <AddDoctorDialog isOpen={isAddDoctorOpen} onClose={() => setIsAddDoctorOpen(false)} />
    </>
  );
}

