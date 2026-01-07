"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";
import { AppointmentsHeader } from "@/components/doctor/appointments/AppointmentsHeader";
import { ConfirmDialog } from "@/components/shared";
import { useAppointmentsLogic } from "@/components/doctor/appointments/hooks/useAppointmentsLogic";
import { CalendarView } from "@/components/doctor/appointments/views/CalendarView";
import { ListView } from "@/components/doctor/appointments/views/ListView";
import { cn } from "@/lib/utils";
import type { DoctorAppointmentListItem } from "@/lib/types/appointments";

type ViewMode = "calendar" | "list";

export default function DoctorAppointmentsPageClient() {
  const router = useRouter();

  // Logic Hook
  const {
    appointments,
    isLoading,
    counts,
    activeTab,
    filters,
    handleTabChange,
    handleStatusUpdate,
    handleBulkCancelToday,
    todaysAppointmentsCount,
    isUpdating,
    isBulkCancelling
  } = useAppointmentsLogic();

  // View State
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointmentListItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Dialog States
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [bulkCancelConfirmOpen, setBulkCancelConfirmOpen] = useState(false);
  const [appointmentToUpdate, setAppointmentToUpdate] = useState<{ id: string; status: "CONFIRMED" | "CANCELLED" | "COMPLETED" } | null>(null);

  // Handle date select from calendar
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    // If there's only one appointment on this date, select it
    if (date) {
      const dateAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.date);
        return format(aptDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
      });
      if (dateAppointments.length === 1) {
        setSelectedAppointment(dateAppointments[0]);
      } else {
        setSelectedAppointment(null);
      }
    } else {
      setSelectedAppointment(null);
    }
  };

  const handleCreatePrescription = (appointmentId: string) => {
    router.push(`/doctor/prescriptions/create?appointmentId=${appointmentId}`);
  };

  return (
    <DoctorDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <AppointmentsHeader
          todaysAppointmentsCount={todaysAppointmentsCount}
          onBulkCancel={() => setBulkCancelConfirmOpen(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Main Content Area */}
        <div className={cn("grid gap-6 h-[calc(100vh-250px)] min-h-[600px]", viewMode === "calendar" ? "lg:grid-cols-12" : "grid-cols-1")}>
          {viewMode === "calendar" ? (
            <CalendarView
              appointments={appointments}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              selectedAppointment={selectedAppointment}
              onSelectAppointment={setSelectedAppointment}
              isLoading={isLoading}
              filters={filters}
              actions={{
                onCancel: (id) => {
                  setAppointmentToUpdate({ id, status: "CANCELLED" });
                  setCancelConfirmOpen(true);
                },
                onComplete: (id) => {
                  setAppointmentToUpdate({ id, status: "COMPLETED" });
                  setCompleteConfirmOpen(true);
                },
                onCreatePrescription: handleCreatePrescription,
              }}
              isUpdating={isUpdating}
            />
          ) : (
            <ListView
              activeTab={activeTab}
              onTabChange={handleTabChange}
              counts={counts}
              appointments={appointments}
              isLoading={isLoading}
              filters={filters}
              onAppointmentClick={(appointment) => {
                setSelectedAppointment(appointment);
                setSelectedDate(new Date(appointment.date));
                setViewMode("calendar");
              }}
            />
          )}
        </div>
      </div>

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

      {/* Bulk Cancel Today's Appointments Confirmation */}
      <ConfirmDialog
        open={bulkCancelConfirmOpen}
        onOpenChange={setBulkCancelConfirmOpen}
        title="Cancel All Today's Appointments"
        description={`Are you sure you want to cancel all ${todaysAppointmentsCount} appointment(s) for today? All patients will be notified.`}
        warningText="This action cannot be undone. If payments were made, refunds will be processed according to your cancellation policy."
        confirmLabel={isBulkCancelling ? "Cancelling..." : `Cancel All (${todaysAppointmentsCount})`}
        cancelLabel="Keep Appointments"
        variant="destructive"
        onConfirm={() => {
          handleBulkCancelToday();
          setBulkCancelConfirmOpen(false);
        }}
      />
    </DoctorDashboardLayout>
  );
}

