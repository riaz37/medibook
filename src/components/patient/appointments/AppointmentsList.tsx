"use client";

import { useMemo } from "react";
import { parseISO, isPast, isToday, isAfter } from "date-fns";
import AppointmentCard, { AppointmentCardProps } from "./AppointmentCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { AppointmentListSkeleton } from "@/components/shared";


export type AppointmentFilter = "all" | "upcoming" | "completed";

export interface AppointmentsListProps {
  appointments: AppointmentCardProps["appointment"][];
  filter?: AppointmentFilter;
  searchQuery?: string;
  statusFilter?: string;
  isLoading?: boolean;
  onCancel?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

function getEmptyStateMessage(filter: AppointmentFilter, hasSearch: boolean) {
  if (hasSearch) {
    return {
      title: "No appointments found",
      description: "Try adjusting your search or filters to find what you're looking for.",
      cta: "Clear Filters",
      href: "/patient/appointments",
    };
  }

  const messages = {
    all: {
      title: "No appointments yet",
      description: "You haven't booked any appointments. Book your first appointment to get started.",
      cta: "Book Appointment",
      href: "/patient/appointments/book",
    },
    upcoming: {
      title: "No upcoming appointments",
      description: "You don't have any upcoming appointments scheduled.",
      cta: "Book Appointment",
      href: "/patient/appointments/book",
    },
    completed: {
      title: "No completed appointments",
      description: "You haven't completed any appointments yet.",
      cta: "Book Appointment",
      href: "/patient/appointments/book",
    },
  };

  return messages[filter];
}

export default function AppointmentsList({
  appointments,
  filter = "all",
  searchQuery = "",
  statusFilter = "all",
  isLoading = false,
  onCancel,
  onViewDetails,
}: AppointmentsListProps) {
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // Apply date filter (upcoming/completed)
    if (filter !== "all") {
      const now = new Date();
      filtered = filtered.filter((appointment) => {
        const appointmentDate = parseISO(appointment.date);
        const isAppointmentPast = isPast(appointmentDate) && !isToday(appointmentDate);
        const isAppointmentUpcoming = isAfter(appointmentDate, now) || isToday(appointmentDate);

        if (filter === "upcoming") {
          return (
            isAppointmentUpcoming &&
            (appointment.status === "CONFIRMED" || appointment.status === "PENDING")
          );
        }

        if (filter === "completed") {
          return (
            appointment.status === "COMPLETED" ||
            (isAppointmentPast && appointment.status === "CONFIRMED")
          );
        }

        return true;
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((appointment) => appointment.status === statusFilter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((appointment) => {
        return (
          appointment.doctorName.toLowerCase().includes(query) ||
          appointment.reason?.toLowerCase().includes(query) ||
          appointment.date.includes(query) ||
          appointment.time.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [appointments, filter, statusFilter, searchQuery]);

  // Sort by date (upcoming first, then by time)
  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);

      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }

      return a.time.localeCompare(b.time);
    });
  }, [filteredAppointments]);

  if (isLoading) {
    return <AppointmentListSkeleton count={5} />;
  }

  if (sortedAppointments.length === 0) {
    const emptyState = getEmptyStateMessage(filter, searchQuery.trim() !== "" || statusFilter !== "all");
    return (
      <EmptyState
        icon={Calendar}
        title={emptyState.title}
        description={emptyState.description}
        action={{
          label: emptyState.cta,
          href: emptyState.href,
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {sortedAppointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onCancel={onCancel}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}

