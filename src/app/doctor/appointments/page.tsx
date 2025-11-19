"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DoctorDashboardLayout } from "@/components/doctor/layout/DoctorDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, CheckCircle2, AlertCircle, Phone, Mail, SearchIcon, XCircleIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useDoctorAppointments, useUpdateAppointmentStatus } from "@/hooks";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/loading-skeleton";

type AppointmentStatus = "all" | "pending" | "upcoming" | "completed";

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  reason?: string;
  notes?: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
}

function DoctorAppointmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  // Get initial tab from URL or default to "all"
  const initialTab = (searchParams.get("status") as AppointmentStatus) || "all";
  const [activeTab, setActiveTab] = useState<AppointmentStatus>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch appointments
  const { data: appointmentsData = [], isLoading } = useDoctorAppointments();
  
  // Transform appointments to match our interface
  const appointments = useMemo(() => {
    return appointmentsData.map((apt: any) => ({
      id: apt.id,
      date: apt.date instanceof Date ? apt.date.toISOString() : apt.date,
      time: apt.time,
      status: apt.status,
      reason: apt.reason,
      notes: apt.notes,
      user: apt.user || {
        firstName: null,
        lastName: null,
        email: "",
        phone: null,
      },
    }));
  }, [appointmentsData]);

  // Update appointment status mutation
  const updateStatusMutation = useUpdateAppointmentStatus();

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // Apply status filter
    if (activeTab !== "all") {
      const now = new Date();
      filtered = filtered.filter((appointment) => {
        const appointmentDate = new Date(appointment.date);
        const isUpcoming = appointmentDate >= now;
        const isPending = appointment.status === "PENDING";
        const isCompleted = appointment.status === "COMPLETED";

        if (activeTab === "pending") return isPending;
        if (activeTab === "upcoming") return isUpcoming && (appointment.status === "CONFIRMED" || isPending);
        if (activeTab === "completed") return isCompleted;
        return true;
      });
    }

    // Apply status filter dropdown
    if (statusFilter !== "all") {
      filtered = filtered.filter((appointment) => appointment.status === statusFilter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((appointment) => {
        const patientName = `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim();
        return (
          patientName.toLowerCase().includes(query) ||
          appointment.user.email.toLowerCase().includes(query) ||
          appointment.reason?.toLowerCase().includes(query) ||
          appointment.date.includes(query) ||
          appointment.time.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [appointments, activeTab, statusFilter, searchQuery]);

  // Calculate counts
  const counts = useMemo(() => {
    const now = new Date();
    let pending = 0;
    let upcoming = 0;
    let completed = 0;

    appointments.forEach((appointment) => {
      const appointmentDate = new Date(appointment.date);
      const isUpcoming = appointmentDate >= now;

      if (appointment.status === "PENDING") pending++;
      if (isUpcoming && (appointment.status === "CONFIRMED" || appointment.status === "PENDING")) upcoming++;
      if (appointment.status === "COMPLETED") completed++;
    });

    return {
      all: appointments.length,
      pending,
      upcoming,
      completed,
    };
  }, [appointments]);

  // Handle tab change
  const handleTabChange = (tab: AppointmentStatus) => {
    setActiveTab(tab);
    router.push(`/doctor/appointments?status=${tab}`);
  };

  // Handle status update
  const handleStatusUpdate = async (appointmentId: string, newStatus: "CONFIRMED" | "CANCELLED" | "COMPLETED") => {
    updateStatusMutation.mutate(
      { id: appointmentId, status: newStatus },
      {
        onSuccess: () => {
          toast.success("Appointment updated successfully");
        },
        onError: (error: Error) => {
          toast.error(error.message || "Failed to update appointment");
        },
      }
    );
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "all";

  return (
    <DoctorDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Appointments</h1>
          <p className="text-muted-foreground">
            Manage your appointments, confirm pending requests, and track your schedule
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:bg-transparent"
                onClick={() => setSearchQuery("")}
              >
                <XCircleIcon className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">
              Clear Filters
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>View and manage your appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as AppointmentStatus)}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">
                  All
                  {counts.all > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {counts.all}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending
                  {counts.pending > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {counts.pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {isLoading ? (
                  <PageLoading message="Loading appointments..." />
                ) : filteredAppointments.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No appointments found"
                    description={
                      hasActiveFilters
                        ? "Try adjusting your filters to find appointments."
                        : "You don't have any appointments yet."
                    }
                    action={
                      hasActiveFilters
                        ? {
                            label: "Clear Filters",
                            onClick: handleClearFilters,
                          }
                        : undefined
                    }
                  />
                ) : (
                  <div className="space-y-4">
                    {filteredAppointments.map((appointment) => {
                      const appointmentDate = new Date(appointment.date);
                      const isUpcoming = appointmentDate >= new Date();
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
                                      disabled={updateStatusMutation.isPending}
                                    >
                                      {updateStatusMutation.isPending ? "Confirming..." : "Confirm"}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm("Are you sure you want to cancel this appointment?")) {
                                          handleStatusUpdate(appointment.id, "CANCELLED");
                                        }
                                      }}
                                      disabled={updateStatusMutation.isPending}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                )}
                                {isConfirmed && isUpcoming && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm("Mark this appointment as completed?")) {
                                        handleStatusUpdate(appointment.id, "COMPLETED");
                                      }
                                    }}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    {updateStatusMutation.isPending ? "Updating..." : "Mark Complete"}
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
    </DoctorDashboardLayout>
  );
}

export default DoctorAppointmentsPage;

