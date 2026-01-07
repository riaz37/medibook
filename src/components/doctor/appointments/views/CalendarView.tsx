import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search as SearchIcon } from "lucide-react";
import { format } from "date-fns";
import { useMemo } from "react";
import { AppointmentCalendar } from "@/components/doctor/appointments/AppointmentCalendar";
import { AppointmentAgendaView } from "@/components/doctor/appointments/AppointmentAgendaView";
import { AppointmentDetailsPanel } from "@/components/doctor/appointments/AppointmentDetailsPanel";
import type { DoctorAppointmentListItem } from "@/lib/types/appointments";

interface CalendarViewProps {
    appointments: DoctorAppointmentListItem[];
    selectedDate: Date | undefined;
    onDateSelect: (date: Date | undefined) => void;
    selectedAppointment: DoctorAppointmentListItem | null;
    onSelectAppointment: (appointment: DoctorAppointmentListItem | null) => void;
    isLoading: boolean;
    filters: {
        searchQuery: string;
        setSearchQuery: (query: string) => void;
        statusFilter: string;
        setStatusFilter: (status: string) => void;
    };
    actions: {
        onCancel: (id: string) => void;
        onComplete: (id: string) => void;
        onCreatePrescription: (id: string) => void;
    };
    isUpdating?: boolean;
}

export function CalendarView({
    appointments,
    selectedDate,
    onDateSelect,
    selectedAppointment,
    onSelectAppointment,
    isLoading,
    filters,
    actions,
    isUpdating
}: CalendarViewProps) {

    // Get appointments for the selected date
    const selectedDateAppointments = useMemo(() => {
        if (!selectedDate) return [];
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        return appointments.filter((apt) => {
            const aptDate = new Date(apt.date);
            return format(aptDate, "yyyy-MM-dd") === dateStr;
        });
    }, [appointments, selectedDate]);

    return (
        <>
            {/* Pane 1: Mini Calendar & Filters (Col 1-3) */}
            <div className="lg:col-span-3 space-y-6 overflow-y-auto pr-2">
                <Card className="border-none shadow-none bg-transparent">
                    <CardContent className="p-0">
                        <AppointmentCalendar
                            appointments={appointments}
                            selectedDate={selectedDate}
                            onDateSelect={onDateSelect}
                        />
                    </CardContent>
                </Card>

                <div className="space-y-4 pt-6 border-t">
                    <h4 className="text-sm font-semibold">Quick Filters</h4>
                    <Select value={filters.statusFilter} onValueChange={filters.setStatusFilter}>
                        <SelectTrigger className="w-full bg-background">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Patient name..."
                            value={filters.searchQuery}
                            onChange={(e) => filters.setSearchQuery(e.target.value)}
                            className="pl-9 bg-background"
                        />
                    </div>
                </div>
            </div>

            {/* Pane 2: Agenda / Daily Queue (Col 4-8) */}
            <div className="lg:col-span-5 flex flex-col h-full overflow-hidden">
                <AppointmentAgendaView
                    date={selectedDate || new Date()}
                    appointments={selectedDateAppointments}
                    selectedAppointmentId={selectedAppointment?.id}
                    onAppointmentClick={onSelectAppointment}
                    isLoading={isLoading}
                />
            </div>

            {/* Pane 3: Detailed Context (Col 9-12) */}
            <div className="lg:col-span-4 h-full overflow-y-auto">
                <AppointmentDetailsPanel
                    appointment={selectedAppointment}
                    onClose={() => onSelectAppointment(null)}
                    onCancel={actions.onCancel}
                    onComplete={actions.onComplete}
                    onCreatePrescription={actions.onCreatePrescription}
                    isLoading={isUpdating || false}
                />
            </div>
        </>
    );
}
