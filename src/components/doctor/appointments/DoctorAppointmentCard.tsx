"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Mail, Phone, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface DoctorAppointmentCardProps {
    appointment: {
        id: string;
        date: string | Date;
        time: string;
        status: string;
        reason?: string | null;
        notes?: string | null;
        user: {
            firstName: string | null;
            lastName: string | null;
            email: string;
            phone: string | null;
        };
    };
    onCancel?: (id: string) => void;
    onComplete?: (id: string) => void;
    onPrescribe?: (id: string) => void;
    isUpdating?: boolean;
    className?: string;
    onClick?: () => void;
}

export function DoctorAppointmentCard({
    appointment,
    onCancel,
    onComplete,
    onPrescribe,
    isUpdating,
    className,
    onClick,
}: DoctorAppointmentCardProps) {
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    const isUpcoming = appointmentDate >= now;
    const isPending = appointment.status === "PENDING";
    const isConfirmed = appointment.status === "CONFIRMED";
    const isCompleted = appointment.status === "COMPLETED";
    const isCancelled = appointment.status === "CANCELLED";

    const patientName = `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim() || "Patient";

    return (
        <Card
            className={cn(
                "hover:shadow-md transition-shadow",
                onClick && "cursor-pointer border-l-4",
                isPending && onClick && "border-l-yellow-500",
                isConfirmed && onClick && "border-l-blue-500",
                className
            )}
            onClick={onClick}
        >
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

                    <div className="flex gap-2" onClick={(e) => onClick && e.stopPropagation()}>
                        {onCancel && isPending && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onCancel(appointment.id)}
                                disabled={isUpdating}
                            >
                                {isUpdating ? "Cancelling..." : "Cancel"}
                            </Button>
                        )}

                        {onComplete && isConfirmed && isUpcoming && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onComplete(appointment.id)}
                                disabled={isUpdating}
                            >
                                {isUpdating ? "Updating..." : "Mark Complete"}
                            </Button>
                        )}

                        {onPrescribe && (isConfirmed || isCompleted) && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onPrescribe(appointment.id)}
                                className="gap-2"
                            >
                                <FileText className="h-4 w-4" />
                                Prescribe
                            </Button>
                        )}

                        {onClick && !onCancel && !onComplete && !onPrescribe && (
                            <Button variant="ghost" size="sm">View Details</Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
