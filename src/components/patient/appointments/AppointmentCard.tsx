"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO, isPast, isToday } from "date-fns";
import { Calendar, Clock, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export interface AppointmentCardProps {
  appointment: {
    id: string;
    doctorName: string;
    doctorImageUrl?: string;
    reason?: string | null;
    date: string;
    time: string;
    status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
    duration?: number;
    price?: number;
  };
  onCancel?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

const statusColors = {
  PENDING: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  CONFIRMED: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  COMPLETED: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  CANCELLED: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

const statusLabels = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function AppointmentCard({
  appointment,
  onCancel,
  onViewDetails,
}: AppointmentCardProps) {
  const appointmentDate = parseISO(appointment.date);
  const isUpcoming = !isPast(appointmentDate) || isToday(appointmentDate);
  const canCancel = appointment.status === "CONFIRMED" && isUpcoming;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Doctor Avatar */}
          <div className="relative flex-shrink-0">
            {appointment.doctorImageUrl ? (
              <Image
                src={appointment.doctorImageUrl}
                alt={appointment.doctorName}
                width={56}
                height={56}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
            )}
          </div>

          {/* Appointment Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{appointment.doctorName}</h3>
                <p className="text-sm text-muted-foreground truncate">{appointment.reason}</p>
              </div>
              <Badge
                variant="outline"
                className={`${statusColors[appointment.status]} shrink-0`}
              >
                {statusLabels[appointment.status]}
              </Badge>
            </div>

            {/* Date and Time */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(appointmentDate, "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{appointment.time}</span>
              </div>
              {appointment.duration && (
                <span className="text-xs">({appointment.duration} min)</span>
              )}
            </div>

            {/* Price (if available) */}
            {appointment.price && appointment.status !== "CANCELLED" && (
              <p className="text-sm font-medium text-foreground mb-4">
                Price: ${appointment.price}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(appointment.id)}
                  asChild
                  className="min-h-[44px] touch-manipulation"
                >
                  <Link href={`/appointments/${appointment.id}`}>View Details</Link>
                </Button>
              )}
              {canCancel && onCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCancel(appointment.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 min-h-[44px] touch-manipulation"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

