"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Stethoscope, Calendar } from "lucide-react";
import AppointmentsTabs from "@/components/patient/appointments/AppointmentsTabs";
import MyAppointmentsTab, { AppointmentFilter } from "@/components/patient/appointments/MyAppointmentsTab";
import AppointmentFilters, { StatusFilter } from "@/components/patient/appointments/AppointmentFilters";
import { StatCard } from "@/components/shared/cards/StatCard";
import { useUserAppointments, useUpdateAppointmentStatus } from "@/hooks/use-appointment";
import { useQueryClient } from "@tanstack/react-query";
import { parseISO, isPast, isToday, isAfter } from "date-fns";
import { CheckCircle2, List } from "lucide-react";
import { toast } from "sonner";
import FindAndBookTab from "@/components/patient/appointments/FindAndBookTab";
import { PageLoading } from "@/components/ui/loading-skeleton";

type MainTab = "find-book" | "my-appointments";

function AppointmentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get main tab from URL or default to "find-book" for new users, "my-appointments" for existing
  const mainTabParam = searchParams.get("tab") as MainTab;
  const [mainTab, setMainTab] = useState<MainTab>(() => {
    // If tab is "find-book" or "my-appointments", use it
    if (mainTabParam === "find-book" || mainTabParam === "my-appointments") {
      return mainTabParam;
    }
    // If it's an old appointment filter (all, upcoming, completed), default to my-appointments
    if (mainTabParam === "all" || mainTabParam === "upcoming" || mainTabParam === "completed") {
      return "my-appointments";
    }
    // Default to find-book for new users
    return "find-book";
  });

  // Get appointment filter from URL for "My Appointments" tab
  const appointmentFilterParam = searchParams.get("filter") as AppointmentFilter;
  const [activeAppointmentTab, setActiveAppointmentTab] = useState<AppointmentFilter>(
    appointmentFilterParam || "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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
      doctorSpeciality: appointment.doctorSpeciality || appointment.doctor?.speciality || null,
      reason: appointment.reason || "Appointment",
      date: appointment.date,
      time: appointment.time,
      status: appointment.status || "CONFIRMED",
      duration: appointment.duration,
      price: appointment.price,
      appointmentTypeName: appointment.appointmentTypeName || appointment.appointmentType?.name || null,
      paymentStatus: appointment.paymentStatus || appointment.payment?.status || null,
      patientPaid: appointment.patientPaid ?? appointment.payment?.patientPaid ?? false,
      refunded: appointment.refunded ?? appointment.payment?.refunded ?? false,
      hasPrescription: appointment.hasPrescription ?? !!appointment.prescription,
      prescriptionId: appointment.prescriptionId || appointment.prescription?.id || null,
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

  // Handle main tab change
  const handleMainTabChange = (tab: MainTab) => {
    setMainTab(tab);
    // Update URL without the old filter params when switching tabs
    if (tab === "find-book") {
      router.push("/patient/appointments?tab=find-book");
    } else {
      router.push(`/patient/appointments?tab=my-appointments&filter=${activeAppointmentTab}`);
    }
  };

  // Handle appointment tab change (within My Appointments)
  const handleAppointmentTabChange = (tab: AppointmentFilter) => {
    setActiveAppointmentTab(tab);
    router.push(`/patient/appointments?tab=my-appointments&filter=${tab}`);
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
          toast.error("Failed to cancel appointment", {
            action: {
              label: "Retry",
              onClick: () => handleCancel(id),
            },
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

  return (
    <PatientDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Appointments</h1>
          <p className="text-muted-foreground">
            {mainTab === "find-book" 
              ? "Find and book appointments with verified healthcare professionals"
              : "Manage your appointments, view upcoming visits, and track your appointment history"
            }
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs
          value={mainTab}
          onValueChange={(value) => handleMainTabChange(value as MainTab)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6 md:mb-8">
            <TabsTrigger value="find-book" className="relative text-sm md:text-base">
              <Stethoscope className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Find & Book</span>
              <span className="sm:hidden">Find</span>
            </TabsTrigger>
            <TabsTrigger value="my-appointments" className="relative text-sm md:text-base">
              <Calendar className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">My Appointments</span>
              <span className="sm:hidden">Appointments</span>
              {counts.all > 0 && (
                <span className="ml-1 md:ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  {counts.all}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Find & Book Tab */}
          <TabsContent value="find-book" className="mt-0">
            <Suspense fallback={<PageLoading message="Loading doctors..." />}>
              <FindAndBookTab />
            </Suspense>
          </TabsContent>

          {/* My Appointments Tab */}
          <TabsContent value="my-appointments" className="mt-0">
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

            {/* Appointment Tabs and List */}
            <AppointmentsTabs
              activeTab={activeAppointmentTab}
              onTabChange={handleAppointmentTabChange}
              counts={counts}
            >
              <MyAppointmentsTab
                appointments={transformedAppointments}
                filter={activeAppointmentTab}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                isLoading={isLoading}
                onCancel={handleCancel}
                onViewDetails={handleViewDetails}
              />
            </AppointmentsTabs>
          </TabsContent>
        </Tabs>
      </div>
    </PatientDashboardLayout>
  );
}

export default function AppointmentsPageClient() {
  return (
    <Suspense fallback={<PageLoading message="Loading appointments..." />}>
      <AppointmentsPageContent />
    </Suspense>
  );
}
