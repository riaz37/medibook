"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO, isPast, isToday } from "date-fns";
import { Calendar, Clock, User, X, CreditCard, FileText, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export interface AppointmentCardProps {
  appointment: {
    id: string;
    doctorName: string;
    doctorImageUrl?: string;
    doctorSpeciality?: string | null;
    reason?: string | null;
    date: string;
    time: string;
    status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
    duration?: number;
    price?: number | null;
    appointmentTypeName?: string | null;
    paymentStatus?: string | null;
    patientPaid?: boolean;
    refunded?: boolean;
    hasPrescription?: boolean;
    prescriptionId?: string | null;
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

function AppointmentCard({
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
                <div className="flex items-center gap-2 mt-1">
                  {appointment.doctorSpeciality && (
                    <Badge variant="secondary" className="text-xs">
                      {appointment.doctorSpeciality}
                    </Badge>
                  )}
                  {appointment.appointmentTypeName && (
                    <Badge variant="outline" className="text-xs">
                      {appointment.appointmentTypeName}
                    </Badge>
                  )}
                </div>
                {appointment.reason && (
                  <p className="text-sm text-muted-foreground truncate mt-1">{appointment.reason}</p>
                )}
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

            {/* Payment Status & Price */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {appointment.price && appointment.status !== "CANCELLED" && (
                <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span>${appointment.price}</span>
                </div>
              )}
              {appointment.paymentStatus && (
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    appointment.patientPaid
                      ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                      : appointment.paymentStatus === "PENDING"
                      ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                      : "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
                  }`}
                >
                  {appointment.refunded ? (
                    <>
                      <X className="w-3 h-3 mr-1" />
                      Refunded
                    </>
                  ) : appointment.patientPaid ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Paid
                    </>
                  ) : (
                    "Unpaid"
                  )}
                </Badge>
              )}
              {appointment.hasPrescription && (
                <Link href={`/patient/prescriptions/${appointment.prescriptionId}`}>
                  <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                    <FileText className="w-3 h-3 mr-1" />
                    Prescription
                  </Badge>
                </Link>
              )}
            </div>

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
                  <Link href={`/patient/appointments/${appointment.id}`}>View Details</Link>
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

// Memoize component to prevent unnecessary re-renders
export default React.memo(AppointmentCard);

