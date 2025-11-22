"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle2, AlertCircle, Phone, Mail, Settings, CalendarDays, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import type { Doctor, Appointment, User } from "@prisma/client";
import { toast } from "sonner";
import { appointmentsService } from "@/lib/services";
import AvailabilitySettings from "@/components/doctor/AvailabilitySettings";
import WorkingHoursSettings from "@/components/doctor/WorkingHoursSettings";
import AppointmentTypesSettings from "@/components/doctor/AppointmentTypesSettings";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { DoctorDashboardClientProps } from "@/lib/types";

export default function DoctorDashboardClient({
  doctor,
  appointments,
  stats,
}: DoctorDashboardClientProps) {
  const [selectedStatus, setSelectedStatus] = useState<"all" | "pending" | "upcoming" | "completed">("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [workingHoursOpen, setWorkingHoursOpen] = useState(false);
  const [appointmentTypesOpen, setAppointmentTypesOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [appointmentToUpdate, setAppointmentToUpdate] = useState<{ id: string; status: "CONFIRMED" | "CANCELLED" | "COMPLETED" } | null>(null);

  const filteredAppointments = appointments.filter((apt) => {
    if (selectedStatus === "pending") {
      return apt.status === "PENDING";
    }
    if (selectedStatus === "upcoming") {
      // Show both PENDING and CONFIRMED as upcoming (future dates)
      return new Date(apt.date) >= new Date() && (apt.status === "CONFIRMED" || apt.status === "PENDING");
    }
    if (selectedStatus === "completed") {
      return apt.status === "COMPLETED";
    }
    return true;
  });

  const handleStatusUpdate = async (appointmentId: string, newStatus: "CONFIRMED" | "CANCELLED" | "COMPLETED") => {
    setIsUpdating(appointmentId);
    try {
      await appointmentsService.updateStatus({ id: appointmentId, status: newStatus });
      
      toast.success(
        newStatus === "CONFIRMED" 
          ? "Appointment confirmed successfully" 
          : newStatus === "CANCELLED"
          ? "Appointment cancelled"
          : "Appointment marked as completed"
      );
      // Reload to show updated status
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update appointment status");
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
        {/* Welcome Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Welcome back, {doctor?.name || "Doctor"}
            </h1>
            <p className="text-muted-foreground">
              Manage your appointments and patients from here
            </p>
          </div>
        </div>

        {/* Quick Settings Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setAvailabilityOpen(true)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Availability</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Configure time slots & booking preferences</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setWorkingHoursOpen(true)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Working Hours</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Set your weekly schedule</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setAppointmentTypesOpen(true)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointment Types</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Manage appointment types you offer</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {appointments.filter((apt) => apt.status === "PENDING").length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcoming}</div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Appointments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>View and manage your appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" onValueChange={(value) => setSelectedStatus(value as typeof selectedStatus)}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">
                  Pending
                  {appointments.filter((apt) => apt.status === "PENDING").length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {appointments.filter((apt) => apt.status === "PENDING").length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedStatus} className="space-y-4">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">
                      {selectedStatus === "pending"
                        ? "No pending appointments"
                        : selectedStatus === "upcoming"
                        ? "No upcoming appointments"
                        : selectedStatus === "completed"
                        ? "No completed appointments"
                        : "No appointments found"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                      {selectedStatus === "pending"
                        ? "All appointments have been confirmed or cancelled. New appointment requests will appear here."
                        : selectedStatus === "upcoming"
                        ? "You don't have any upcoming appointments scheduled. Patients can book appointments through your profile."
                        : selectedStatus === "completed"
                        ? "You haven't completed any appointments yet. Completed appointments will appear here."
                        : "You don't have any appointments yet. Share your profile with patients to start receiving bookings."}
                    </p>
                    {selectedStatus === "all" && (
                      <Button
                        variant="outline"
                        onClick={() => setAppointmentTypesOpen(true)}
                        className="mt-2"
                      >
                        <Stethoscope className="w-4 h-4 mr-2" />
                        Set Up Appointment Types
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAppointments.map((appointment) => {
                      const appointmentDate = new Date(appointment.date);
                      const isUpcoming = appointmentDate >= new Date() && (appointment.status === "CONFIRMED" || appointment.status === "PENDING");
                      const isPending = appointment.status === "PENDING";
                      const isConfirmed = appointment.status === "CONFIRMED";
                      const isCompleted = appointment.status === "COMPLETED";
                      const patientName = `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim() || "Patient";

                      return (
                        <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-semibold">{patientName}</h3>
                                  <Badge
                                    variant={
                                      isCompleted
                                        ? "default"
                                        : isPending
                                        ? "destructive"
                                        : isConfirmed && isUpcoming
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {appointment.status}
                                  </Badge>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(appointmentDate, "MMM dd, yyyy")}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{appointment.time}</span>
                                  </div>
                                  {appointment.reason && (
                                    <div className="flex items-center gap-2">
                                      <span>Reason: {appointment.reason}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{appointment.user.email}</span>
                                  </div>
                                  {appointment.user.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      <span>{appointment.user.phone}</span>
                                    </div>
                                  )}
                                </div>

                                {appointment.notes && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    Notes: {appointment.notes}
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-2">
                                {isPending && (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleStatusUpdate(appointment.id, "CONFIRMED")}
                                      disabled={isUpdating === appointment.id}
                                    >
                                      {isUpdating === appointment.id ? "Confirming..." : "Confirm"}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        setAppointmentToUpdate({ id: appointment.id, status: "CANCELLED" });
                                        setCancelConfirmOpen(true);
                                      }}
                                      disabled={isUpdating === appointment.id}
                                    >
                                      {isUpdating === appointment.id ? "Cancelling..." : "Cancel"}
                                    </Button>
                                  </>
                                )}
                                {isConfirmed && isUpcoming && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setAppointmentToUpdate({ id: appointment.id, status: "COMPLETED" });
                                      setCompleteConfirmOpen(true);
                                    }}
                                    disabled={isUpdating === appointment.id}
                                  >
                                    {isUpdating === appointment.id ? "Updating..." : "Mark Complete"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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

      {/* Cancel Appointment Confirmation */}
      <ConfirmDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this appointment? The patient will be notified."
        warningText="This action cannot be undone. If payment was made, a refund may be processed according to your cancellation policy."
        confirmLabel="Cancel Appointment"
        cancelLabel="Keep Appointment"
        variant="destructive"
        onConfirm={() => {
          if (appointmentToUpdate && appointmentToUpdate.status === "CANCELLED") {
            handleStatusUpdate(appointmentToUpdate.id, "CANCELLED");
            setAppointmentToUpdate(null);
          }
        }}
      />

      {/* Complete Appointment Confirmation */}
      <ConfirmDialog
        open={completeConfirmOpen}
        onOpenChange={setCompleteConfirmOpen}
        title="Mark Appointment as Completed"
        description="Mark this appointment as completed? This will update the appointment status and may trigger payment processing."
        confirmLabel="Mark Complete"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={() => {
          if (appointmentToUpdate && appointmentToUpdate.status === "COMPLETED") {
            handleStatusUpdate(appointmentToUpdate.id, "COMPLETED");
            setAppointmentToUpdate(null);
          }
        }}
      />
    </>
  );
}

