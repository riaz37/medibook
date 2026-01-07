"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, FileText, User, Calendar } from "lucide-react";
import WorkingHoursSettings from "@/components/doctor/WorkingHoursSettings";
import AvailabilitySettings from "@/components/doctor/AvailabilitySettings";
import AppointmentTypesSettings from "@/components/doctor/AppointmentTypesSettings";
import { DoctorProfileSettings } from "@/components/doctor/settings/DoctorProfileSettings";
import { DoctorVerificationSettings } from "@/components/doctor/settings/DoctorVerificationSettings";
import type { DoctorSettingsClientProps } from "@/lib/types/settings";

export default function DoctorSettingsClient({ doctor, verification }: DoctorSettingsClientProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");
  const [isWorkingHoursOpen, setIsWorkingHoursOpen] = useState(false);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [isAppointmentTypesOpen, setIsAppointmentTypesOpen] = useState(false);

  // Check if we should open a specific tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "documents" || tab === "profile" || tab === "schedule") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const getVerificationStatus = () => {
    if (!verification) return null;

    switch (verification.status) {
      case "APPROVED":
        return {
          icon: CheckCircle2,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-950/20",
          message: "Your account has been verified!",
        };
      case "REJECTED":
        return {
          icon: XCircle,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-950/20",
          message: `Verification rejected: ${verification.rejectionReason || "Please review your documents"}`,
        };
      case "PENDING":
        return {
          icon: Clock,
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
          message: "Your documents are under review. We'll notify you once approved.",
        };
      default:
        return null;
    }
  };

  const statusInfo = getVerificationStatus();

  return (
    <>
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile information and verification documents
          </p>
        </div>

        {/* Verification Status */}
        {statusInfo && (activeTab !== "documents") && (
          <Alert className={statusInfo.bgColor}>
            <statusInfo.icon className={`h-4 w-4 ${statusInfo.color}`} />
            <AlertDescription className={statusInfo.color}>
              {statusInfo.message}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </TabsTrigger>
            {verification && (verification.status === "REJECTED" || verification.status === "PENDING") && (
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Verification Documents
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <DoctorProfileSettings doctor={doctor as any} />
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Schedule Management</CardTitle>
                <CardDescription>
                  Manage your working hours, availability, and appointment types
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setIsWorkingHoursOpen(true)}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <Calendar className="w-8 h-8 text-primary" />
                        <h3 className="font-semibold">Working Hours</h3>
                        <p className="text-sm text-muted-foreground">
                          Set your weekly schedule and hours for each day
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setIsAvailabilityOpen(true)}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <Clock className="w-8 h-8 text-primary" />
                        <h3 className="font-semibold">Availability</h3>
                        <p className="text-sm text-muted-foreground">
                          Configure time slots and booking preferences
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setIsAppointmentTypesOpen(true)}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <FileText className="w-8 h-8 text-primary" />
                        <h3 className="font-semibold">Appointment Types</h3>
                        <p className="text-sm text-muted-foreground">
                          Manage appointment types, durations, and pricing
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Quick Guide</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li><strong>Working Hours:</strong> Set which days you work and your start/end times</li>
                    <li><strong>Availability:</strong> Choose specific time slots and booking rules</li>
                    <li><strong>Appointment Types:</strong> Define consultation types with durations and prices</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <DoctorVerificationSettings doctor={doctor as any} verification={verification as any} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Schedule Management Dialogs */}
      {doctor && (
        <>
          <WorkingHoursSettings
            doctorId={doctor.id}
            open={isWorkingHoursOpen}
            onOpenChange={setIsWorkingHoursOpen}
          />
          <AvailabilitySettings
            doctorId={doctor.id}
            open={isAvailabilityOpen}
            onOpenChange={setIsAvailabilityOpen}
          />
          <AppointmentTypesSettings
            doctorId={doctor.id}
            open={isAppointmentTypesOpen}
            onOpenChange={setIsAppointmentTypesOpen}
          />
        </>
      )}
    </>
  );
}


