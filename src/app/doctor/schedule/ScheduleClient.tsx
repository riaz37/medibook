"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText } from "lucide-react";
import WorkingHoursSettings from "@/components/doctor/WorkingHoursSettings";
import AvailabilitySettings from "@/components/doctor/AvailabilitySettings";
import AppointmentTypesSettings from "@/components/doctor/AppointmentTypesSettings";

interface ScheduleClientProps {
  doctorId: string;
}

export default function ScheduleClient({ doctorId }: ScheduleClientProps) {
  const [isWorkingHoursOpen, setIsWorkingHoursOpen] = useState(false);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [isAppointmentTypesOpen, setIsAppointmentTypesOpen] = useState(false);

  return (
    <>
      <div className="max-w-6xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Schedule Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your working hours, availability, and appointment types
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setIsWorkingHoursOpen(true)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Working Hours</CardTitle>
                  <CardDescription>Set your weekly schedule</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure which days you work and your start/end times for each day of the week.
              </p>
              <Button className="w-full" variant="outline">
                Manage Working Hours
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setIsAvailabilityOpen(true)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Availability</CardTitle>
                  <CardDescription>Configure time slots</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Select specific time slots, set slot duration, and configure booking preferences.
              </p>
              <Button className="w-full" variant="outline">
                Manage Availability
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setIsAppointmentTypesOpen(true)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Appointment Types</CardTitle>
                  <CardDescription>Manage consultation types</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create and manage different appointment types with durations and pricing.
              </p>
              <Button className="w-full" variant="outline">
                Manage Appointment Types
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Guide</CardTitle>
            <CardDescription>Understanding schedule management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Working Hours
                </h4>
                <p className="text-sm text-muted-foreground">
                  Set which days of the week you work and your start/end times. This defines your general availability.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Availability
                </h4>
                <p className="text-sm text-muted-foreground">
                  Choose specific time slots when patients can book appointments. Configure slot duration, how far in advance patients can book, and minimum booking notice.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Appointment Types
                </h4>
                <p className="text-sm text-muted-foreground">
                  Define different types of consultations (e.g., Initial Consultation, Follow-up, Emergency) with their durations and prices. Patients will see these options when booking.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Management Dialogs */}
      <WorkingHoursSettings
        doctorId={doctorId}
        open={isWorkingHoursOpen}
        onOpenChange={setIsWorkingHoursOpen}
      />
      <AvailabilitySettings
        doctorId={doctorId}
        open={isAvailabilityOpen}
        onOpenChange={setIsAvailabilityOpen}
      />
      <AppointmentTypesSettings
        doctorId={doctorId}
        open={isAppointmentTypesOpen}
        onOpenChange={setIsAppointmentTypesOpen}
      />
    </>
  );
}

