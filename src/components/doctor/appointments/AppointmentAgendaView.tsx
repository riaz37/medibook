"use client";

import { useMemo } from "react";
import { format, parseISO, isToday, isPast, isFuture } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DoctorAppointmentListItem } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AppointmentAgendaViewProps {
    date: Date;
    appointments: DoctorAppointmentListItem[];
    selectedAppointmentId?: string;
    onAppointmentClick: (appointment: DoctorAppointmentListItem) => void;
    isLoading?: boolean;
}

export function AppointmentAgendaView({
    date,
    appointments,
    selectedAppointmentId,
    onAppointmentClick,
    isLoading = false,
}: AppointmentAgendaViewProps) {
    const sortedAppointments = useMemo(() => {
        return [...appointments].sort((a, b) => {
            return a.time.localeCompare(b.time);
        });
    }, [appointments]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "CONFIRMED":
                return { color: "text-blue-600 bg-blue-50 border-blue-100", icon: Clock };
            case "PENDING":
                return { color: "text-yellow-600 bg-yellow-50 border-yellow-100", icon: AlertCircle };
            case "COMPLETED":
                return { color: "text-green-600 bg-green-50 border-green-100", icon: CheckCircle2 };
            case "CANCELLED":
                return { color: "text-red-600 bg-red-50 border-red-100", icon: AlertCircle };
            default:
                return { color: "text-gray-600 bg-gray-50 border-gray-100", icon: Clock };
        }
    };

    return (
        <div className="flex flex-col h-full bg-background rounded-lg border shadow-sm overflow-hidden text-balance">
            <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-lg">
                            {isToday(date) ? "Today's Agenda" : format(date, "EEEE, MMM d")}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {appointments.length} {appointments.length === 1 ? "appointment" : "appointments"} scheduled
                        </p>
                    </div>
                    {isToday(date) && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 animate-pulse">
                            Live
                        </Badge>
                    )}
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-24 w-full rounded-lg bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : sortedAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Clock className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h4 className="font-medium">No appointments</h4>
                            <p className="text-sm text-muted-foreground">No appointments scheduled for this day.</p>
                        </div>
                    ) : (
                        sortedAppointments.map((apt) => {
                            const status = getStatusConfig(apt.status);
                            const isSelected = apt.id === selectedAppointmentId;
                            const patientName = `${apt.user.firstName || ""} ${apt.user.lastName || ""}`.trim() || "Patient";

                            return (
                                <button
                                    key={apt.id}
                                    onClick={() => onAppointmentClick(apt)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden",
                                        isSelected
                                            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                                            : "border-transparent bg-muted/40 hover:bg-muted/60 hover:border-muted-foreground/20"
                                    )}
                                >
                                    {isSelected && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                    )}

                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center min-w-[50px]">
                                            <span className="text-sm font-bold">{apt.time}</span>
                                            <div className={cn(
                                                "mt-2 w-px flex-1 bg-border group-last:hidden"
                                            )} />
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
                                                    {patientName}
                                                </h4>
                                                <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-1.5 py-0 h-5", status.color)}>
                                                    {apt.status}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    <span>General Visit</span>
                                                </div>
                                                {apt.reason && (
                                                    <div className="flex items-center gap-1">
                                                        <MessageSquare className="h-3 w-3" />
                                                        <span className="truncate">{apt.reason}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
