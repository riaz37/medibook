"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, CalendarDays, Stethoscope, User } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AvailabilitySettings from "@/components/doctor/AvailabilitySettings";
import WorkingHoursSettings from "@/components/doctor/WorkingHoursSettings";
import AppointmentTypesSettings from "@/components/doctor/AppointmentTypesSettings";
import type { Doctor } from "@prisma/client";

interface QuickSettingsProps {
  doctor: Doctor | null;
}

export default function QuickSettings({ doctor }: QuickSettingsProps) {
  const router = useRouter();
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [workingHoursOpen, setWorkingHoursOpen] = useState(false);
  const [appointmentTypesOpen, setAppointmentTypesOpen] = useState(false);

  const settings = [
    {
      title: "Availability",
      description: "Configure time slots & booking preferences",
      icon: Settings,
      onClick: () => setAvailabilityOpen(true),
    },
    {
      title: "Working Hours",
      description: "Set your weekly schedule",
      icon: CalendarDays,
      onClick: () => setWorkingHoursOpen(true),
    },
    {
      title: "Appointment Types",
      description: "Manage appointment types you offer",
      icon: Stethoscope,
      onClick: () => setAppointmentTypesOpen(true),
    },
    {
      title: "Profile Settings",
      description: "Update your profile information",
      icon: User,
      onClick: () => router.push("/doctor/settings?tab=profile"),
    },
  ];

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {settings.map((setting) => {
          const Icon = setting.icon;
          return (
            <Card
              key={setting.title}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                setting.disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={setting.disabled ? undefined : setting.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{setting.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{setting.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Settings Dialogs */}
      {doctor && (
        <>
          <AvailabilitySettings
            doctorId={doctor.id}
            open={availabilityOpen}
            onOpenChange={setAvailabilityOpen}
          />
          <WorkingHoursSettings
            doctorId={doctor.id}
            open={workingHoursOpen}
            onOpenChange={setWorkingHoursOpen}
          />
          <AppointmentTypesSettings
            doctorId={doctor.id}
            open={appointmentTypesOpen}
            onOpenChange={setAppointmentTypesOpen}
          />
        </>
      )}
    </>
  );
}

