import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDoctorAppointments, useUpdateAppointmentStatus } from "@/hooks";
import { apiClient } from "@/lib/services/api-client.service";
import type { DoctorAppointmentListItem } from "@/lib/types/appointments";

export type AppointmentStatus = "all" | "pending" | "upcoming" | "completed";

export function useAppointmentsLogic() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    // URL State
    const initialTab = (searchParams.get("status") as AppointmentStatus) || "all";
    const [activeTab, setActiveTab] = useState<AppointmentStatus>(initialTab);

    // Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Fetch appointments
    const { data: appointmentsData = [], isLoading } = useDoctorAppointments();

    // Transform appointments
    const appointments = useMemo((): DoctorAppointmentListItem[] => {
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

    // Filter Logic
    const filteredAppointments = useMemo(() => {
        let filtered = appointments;
        const now = new Date();

        // 1. Tab Status Filter
        if (activeTab !== "all") {
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

        // 2. Dropdown Status Filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((appointment) => appointment.status === statusFilter);
        }

        // 3. Search Query
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

    // Counts Logic
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

    // Handlers
    const handleTabChange = (tab: AppointmentStatus) => {
        setActiveTab(tab);
        router.push(`/doctor/appointments?status=${tab}`);
    };

    const handleClearFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
    };

    // Mutations
    const updateStatusMutation = useUpdateAppointmentStatus();

    const handleStatusUpdate = async (appointmentId: string, newStatus: "CONFIRMED" | "CANCELLED" | "COMPLETED") => {
        const previousData = queryClient.getQueryData(["doctorAppointments"]);

        // Optimistic Update
        queryClient.setQueryData(["doctorAppointments"], (old: any) => {
            if (!old) return old;
            return old.map((apt: any) =>
                apt.id === appointmentId ? { ...apt, status: newStatus } : apt
            );
        });

        updateStatusMutation.mutate(
            { id: appointmentId, status: newStatus },
            {
                onSuccess: () => {
                    toast.success("Appointment updated successfully");
                    queryClient.invalidateQueries({ queryKey: ["doctorAppointments"] });
                },
                onError: (error: Error) => {
                    queryClient.setQueryData(["doctorAppointments"], previousData);
                    toast.error(error.message || "Failed to update appointment");
                },
            }
        );
    };

    const [isBulkCancelling, setIsBulkCancelling] = useState(false);

    const handleBulkCancelToday = async () => {
        setIsBulkCancelling(true);
        try {
            const result = await apiClient.bulkCancelTodayAppointments(
                "Bulk cancelled: All today's appointments cancelled by doctor"
            );
            toast.success(
                `Successfully cancelled ${result.cancelledCount} appointment(s)${result.failedCount > 0 ? `. ${result.failedCount} failed.` : ""}`
            );
            queryClient.invalidateQueries({ queryKey: ["doctorAppointments"] });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to cancel today's appointments");
        } finally {
            setIsBulkCancelling(false);
        }
    };

    // Todays Count
    const todaysAppointmentsCount = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);

        return filteredAppointments.filter((apt) => {
            const aptDate = new Date(apt.date);
            return aptDate >= today && aptDate <= endOfToday && apt.status !== "CANCELLED";
        }).length;
    }, [filteredAppointments]);

    return {
        appointments: filteredAppointments,
        isLoading,
        counts,
        activeTab,
        filters: {
            searchQuery,
            statusFilter,
            setSearchQuery,
            setStatusFilter,
            handleClearFilters,
            hasActiveFilters: searchQuery.trim() !== "" || statusFilter !== "all",
        },
        handleTabChange,
        handleStatusUpdate,
        handleBulkCancelToday,
        todaysAppointmentsCount,
        isUpdating: updateStatusMutation.isPending,
        isBulkCancelling,
    };
}
