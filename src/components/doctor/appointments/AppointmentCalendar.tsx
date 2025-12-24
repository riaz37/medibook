"use client";

import { useState, useMemo } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isSameDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DoctorAppointmentListItem } from "@/lib/types";

interface AppointmentCalendarProps {
  appointments: DoctorAppointmentListItem[];
  selectedDate?: Date;
  onDateSelect?: (date: Date | undefined) => void;
  onAppointmentClick?: (appointment: DoctorAppointmentListItem) => void;
  viewMode?: "month" | "week" | "day";
  onViewModeChange?: (mode: "month" | "week" | "day") => void;
}

export function AppointmentCalendar({
  appointments,
  selectedDate,
  onDateSelect,
  onAppointmentClick,
  viewMode = "month",
  onViewModeChange,
}: AppointmentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate || new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(selectedDate);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, DoctorAppointmentListItem[]> = {};
    appointments.forEach((apt) => {
      const dateKey = format(new Date(apt.date), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(apt);
    });
    return grouped;
  }, [appointments]);

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date): DoctorAppointmentListItem[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return appointmentsByDate[dateKey] || [];
  };

  // Get dates with appointments for calendar highlighting
  const datesWithAppointments = useMemo(() => {
    return Object.keys(appointmentsByDate).map((dateKey) => new Date(dateKey));
  }, [appointmentsByDate]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-500";
      case "PENDING":
        return "bg-yellow-500";
      case "COMPLETED":
        return "bg-green-500";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Navigate month
  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDay(today);
    onDateSelect?.(today);
  };

  // Get selected day appointments
  const selectedDayAppointments = selectedDay ? getAppointmentsForDate(selectedDay) : [];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
          {onViewModeChange && (
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("month")}
                className="h-7 px-2"
              >
                <LayoutGrid className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === "day" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("day")}
                className="h-7 px-2"
              >
                <CalendarIcon className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          <CalendarComponent
            mode="single"
            selected={selectedDay}
            onSelect={(date) => {
              setSelectedDay(date);
              onDateSelect?.(date);
            }}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="w-full"
          />
          
          {/* Legend for appointment indicators */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
            <span>Appointments:</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Appointments */}
      {selectedDay && selectedDayAppointments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3">
              Appointments on {format(selectedDay, "EEEE, MMMM d, yyyy")}
            </h4>
            <div className="space-y-2">
              {selectedDayAppointments.map((appointment) => {
                const patientName = `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim() || "Patient";
                return (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onAppointmentClick?.(appointment)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={cn("w-2 h-2 rounded-full", getStatusColor(appointment.status))} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{patientName}</p>
                        <p className="text-sm text-muted-foreground">{appointment.time}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", getStatusColor(appointment.status), "text-white border-0")}>
                      {appointment.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDay && selectedDayAppointments.length === 0 && (
        <Card>
          <CardContent className="p-4 text-center text-muted-foreground">
            <p>No appointments on {format(selectedDay, "MMMM d, yyyy")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
