"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Mail, Phone, User, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DoctorAppointmentListItem } from "@/lib/types";

interface AppointmentDetailsPanelProps {
  appointment: DoctorAppointmentListItem | null;
  onClose?: () => void;
  onCancel?: (appointmentId: string) => void;
  onComplete?: (appointmentId: string) => void;
  onCreatePrescription?: (appointmentId: string) => void;
  isLoading?: boolean;
}

export function AppointmentDetailsPanel({
  appointment,
  onClose,
  onCancel,
  onComplete,
  onCreatePrescription,
  isLoading = false,
}: AppointmentDetailsPanelProps) {
  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center border-2 border-dashed rounded-xl p-8 bg-muted/20">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Patient Overview</h3>
        <p className="text-muted-foreground text-sm max-w-[200px]">
          Select an appointment from the agenda to view patient details and actions.
        </p>
      </div>
    );
  }

  const appointmentDate = new Date(appointment.date);
  const isUpcoming = appointmentDate >= new Date();
  const isPending = appointment.status === "PENDING";
  const isConfirmed = appointment.status === "CONFIRMED";
  const isCompleted = appointment.status === "COMPLETED";
  const isCancelled = appointment.status === "CANCELLED";
  const patientName = `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim() || "Patient";

  const getStatusBadge = () => {
    switch (appointment.status) {
      case "CONFIRMED":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Confirmed</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{appointment.status}</Badge>;
    }
  };

  return (
    <Card className="border-none shadow-none bg-background">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle>Appointment Details</CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          {getStatusBadge()}
        </div>

        <Separator />

        {/* Patient Information */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Patient Information
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <p className="font-medium">{patientName}</p>
            </div>
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
        </div>

        <Separator />

        {/* Appointment Details */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appointment Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{format(appointmentDate, "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Time:</span>
              <span className="font-medium">{appointment.time}</span>
            </div>
            {appointment.reason && (
              <div>
                <span className="text-muted-foreground">Reason:</span>
                <p className="font-medium">{appointment.reason}</p>
              </div>
            )}
            {appointment.notes && (
              <div>
                <span className="text-muted-foreground">Notes:</span>
                <p className="font-medium">{appointment.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {!isCancelled && (
          <>
            <Separator />
            <div className="space-y-2">
              {isPending && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => onCancel?.(appointment.id)}
                  disabled={isLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Appointment
                </Button>
              )}
              {isConfirmed && isUpcoming && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => onComplete?.(appointment.id)}
                    disabled={isLoading}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onCreatePrescription?.(appointment.id)}
                    disabled={isLoading}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Create Prescription
                  </Button>
                </>
              )}
              {isCompleted && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onCreatePrescription?.(appointment.id)}
                  disabled={isLoading}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Prescription
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

