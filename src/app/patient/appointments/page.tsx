"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import AppointmentsTabs from "@/components/patient/appointments/AppointmentsTabs";
import AppointmentsList, { AppointmentFilter } from "@/components/patient/appointments/AppointmentsList";
import AppointmentFilters, { StatusFilter } from "@/components/patient/appointments/AppointmentFilters";
import { StatCard } from "@/components/ui/stat-card";
import { useUserAppointments, useUpdateAppointmentStatus } from "@/hooks/use-appointment";
import { useQueryClient } from "@tanstack/react-query";
import { parseISO, isPast, isToday, isAfter } from "date-fns";
import { Calendar, CheckCircle2, List } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useRole } from "@/lib/hooks/use-role";
import { useEffect } from "react";

function AppointmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded } = useUser();
  const role = useRole();

  // Get initial tab from URL or default to "all"
  const initialTab = (searchParams.get("tab") as AppointmentFilter) || "all";
  const [activeTab, setActiveTab] = useState<AppointmentFilter>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Redirect doctors away from appointments page
  useEffect(() => {
    if (isLoaded && role === "doctor") {
      router.push("/doctor/dashboard");
    }
  }, [isLoaded, role, router]);

  // Fetch appointments
  const queryClient = useQueryClient();
  const { data: appointments = [], isLoading } = useUserAppointments();
  const updateStatusMutation = useUpdateAppointmentStatus();

  // Transform appointments to match AppointmentCard format
  const transformedAppointments = useMemo(() => {
    return appointments.map((appointment: any) => ({
      id: appointment.id,
      doctorName: appointment.doctorName || appointment.doctor?.name || "Unknown Doctor",
      doctorImageUrl: appointment.doctorImageUrl || appointment.doctor?.imageUrl,
      reason: appointment.reason || "Appointment",
      date: appointment.date,
      time: appointment.time,
      status: appointment.status || "CONFIRMED",
      duration: appointment.duration,
      price: appointment.price,
    }));
  }, [appointments]);

  // Calculate counts
  const counts = useMemo(() => {
    const now = new Date();
    let upcoming = 0;
    let completed = 0;

    transformedAppointments.forEach((appointment) => {
      const appointmentDate = parseISO(appointment.date);
      const isAppointmentPast = isPast(appointmentDate) && !isToday(appointmentDate);
      const isAppointmentUpcoming = isAfter(appointmentDate, now) || isToday(appointmentDate);

      if (
        isAppointmentUpcoming &&
        (appointment.status === "CONFIRMED" || appointment.status === "COMPLETED")
      ) {
        upcoming++;
      }

      if (
        appointment.status === "COMPLETED" ||
        (isAppointmentPast && appointment.status === "CONFIRMED")
      ) {
        completed++;
      }
    });

    return {
      all: transformedAppointments.length,
      upcoming,
      completed,
    };
  }, [transformedAppointments]);

  // Handle tab change
  const handleTabChange = (tab: AppointmentFilter) => {
    setActiveTab(tab);
    router.push(`/patient/appointments?tab=${tab}`);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  // Handle cancel appointment with optimistic update
  const handleCancel = async (id: string) => {
    // Optimistically update the UI
    const previousAppointments = queryClient.getQueryData(["getUserAppointments"]);
    
    queryClient.setQueryData(["getUserAppointments"], (old: any) => {
      if (!old) return old;
      return old.map((apt: any) =>
        apt.id === id ? { ...apt, status: "CANCELLED" } : apt
      );
    });

    updateStatusMutation.mutate(
      { id, status: "CANCELLED" },
      {
        onSuccess: () => {
          toast.success("Appointment cancelled successfully");
          queryClient.invalidateQueries({ queryKey: ["getUserAppointments"] });
        },
        onError: (error) => {
          // Rollback optimistic update on error
          queryClient.setQueryData(["getUserAppointments"], previousAppointments);
          toast.error("Failed to cancel appointment", undefined, () => {
            // Retry on error toast click
            handleCancel(id);
          });
          console.error("Error cancelling appointment:", error);
        },
      }
    );
  };

  // Handle view details
  const handleViewDetails = (id: string) => {
    router.push(`/patient/appointments/${id}`);
  };

  // Don't render if user is a doctor (will redirect)
  if (userRole === "DOCTOR") {
    return null;
  }


  return (
    <PatientDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Appointments</h1>
          <p className="text-muted-foreground">
            Manage your appointments, view upcoming visits, and track your appointment history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Total Appointments"
            value={counts.all}
            description="All time appointments"
            icon={List}
          />
          <StatCard
            title="Upcoming"
            value={counts.upcoming}
            description="Scheduled appointments"
            icon={Calendar}
          />
          <StatCard
            title="Completed"
            value={counts.completed}
            description="Past appointments"
            icon={CheckCircle2}
          />
        </div>

        {/* Filters */}
        <AppointmentFilters
          search={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onClearFilters={handleClearFilters}
        />

        {/* Tabs and Appointments List */}
        <AppointmentsTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={counts}
        >
          <AppointmentsList
            appointments={transformedAppointments}
            filter={activeTab as AppointmentFilter}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            isLoading={isLoading}
            onCancel={handleCancel}
            onViewDetails={handleViewDetails}
          />
        </AppointmentsTabs>
      </div>
    </PatientDashboardLayout>
  );
}

export default AppointmentsPage;
