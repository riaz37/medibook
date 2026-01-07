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
  viewMode = "month",
  onViewModeChange,
}: AppointmentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate || new Date());

  // Group appointments by date for indicators
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
    onDateSelect?.(today);
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={goToToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex justify-center">
        <CalendarComponent
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          className="rounded-md border-0 p-0"
          classNames={{
            months: "w-full",
            month: "w-full space-y-4",
            caption: "hidden",
            table: "w-full border-collapse space-y-1",
            head_row: "flex justify-between w-full",
            head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
            row: "flex w-full mt-2 justify-between",
            cell: "h-8 w-8 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
            day: cn(
              "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-full transition-all"
            ),
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
        />
      </div>

      {/* Simplified Legend */}
      <div className="grid grid-cols-2 gap-y-2 pt-4 border-t text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}
