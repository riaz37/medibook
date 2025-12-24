"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppointmentById, useUpdateAppointmentStatus } from "@/hooks/use-appointment";
import { format, parseISO, isPast, isToday } from "date-fns";
import { Calendar, Clock, User, Phone, Mail, X, CheckCircle2, FileText, CreditCard, DollarSign, AlertCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const statusColors = {
  CONFIRMED: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  COMPLETED: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  CANCELLED: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  PENDING: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
};

const statusLabels = {
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  PENDING: "Pending",
};

export default function AppointmentDetailsPageClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = use(params);
  const { data: appointment, isLoading, error } = useAppointmentById(id);
  const updateStatusMutation = useUpdateAppointmentStatus();
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const handleCancel = () => {
    updateStatusMutation.mutate(
      { id, status: "CANCELLED" },
      {
        onSuccess: () => {
          toast.success("Appointment cancelled successfully");
          queryClient.invalidateQueries({ queryKey: ["getAppointmentById", id] });
          queryClient.invalidateQueries({ queryKey: ["getUserAppointments"] });
          router.push("/patient/appointments");
        },
        onError: (error) => {
          toast.error("Failed to cancel appointment");
          console.error("Error cancelling appointment:", error);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <PatientDashboardLayout>
        <div className="max-w-4xl mx-auto w-full">
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded w-1/4" />
            <div className="h-64 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </PatientDashboardLayout>
    );
  }

  if (error || !appointment) {
    return (
      <PatientDashboardLayout>
        <div className="max-w-4xl mx-auto w-full">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">Appointment not found</p>
              <Button asChild>
                <Link href="/patient/appointments">Back to Appointments</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PatientDashboardLayout>
    );
  }

  const appointmentDate = parseISO(appointment.date);
  const isUpcoming = !isPast(appointmentDate) || isToday(appointmentDate);
  const canCancel = appointment.status === "CONFIRMED" && isUpcoming;

  return (
    <PatientDashboardLayout>
      <div className="max-w-4xl mx-auto w-full">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/patient/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/patient/appointments">Appointments</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Appointment Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Appointment Details</h1>
            <p className="text-muted-foreground">
              {format(appointmentDate, "EEEE, MMMM d, yyyy")} at {appointment.time}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`${statusColors[appointment.status as keyof typeof statusColors]}`}
          >
            {statusLabels[appointment.status as keyof typeof statusLabels]}
          </Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Doctor Information */}
            <Card>
              <CardHeader>
                <CardTitle>Doctor Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  {appointment.doctor?.imageUrl ? (
                    <Image
                      src={appointment.doctor.imageUrl}
                      alt={appointment.doctor.name}
                      width={80}
                      height={80}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">
                      {appointment.doctor?.name || "Unknown Doctor"}
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      {appointment.doctor?.speciality || "General"}
                    </p>
                    {appointment.doctor?.bio && (
                      <p className="text-sm text-muted-foreground">{appointment.doctor.bio}</p>
                    )}
                    <div className="mt-4 space-y-2">
                      {appointment.doctor?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{appointment.doctor.phone}</span>
                        </div>
                      )}
                      {appointment.doctor?.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{appointment.doctor.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Appointment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{format(appointmentDate, "EEEE, MMMM d, yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{appointment.time}</p>
                  </div>
                </div>
                {appointment.appointmentType && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Appointment Type</p>
                      <p className="font-medium">{appointment.appointmentType.name}</p>
                      {appointment.appointmentType.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {appointment.appointmentType.description}
                        </p>
                      )}
                    </div>
                    {appointment.appointmentType.duration && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Duration</p>
                        <p className="font-medium">{appointment.appointmentType.duration} minutes</p>
                      </div>
                    )}
                    {appointment.appointmentType.price && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Price</p>
                        <p className="font-medium">${appointment.appointmentType.price}</p>
                      </div>
                    )}
                  </>
                )}
                {appointment.reason && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Reason</p>
                    <p className="font-medium">{appointment.reason}</p>
                  </div>
                )}
                {appointment.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="font-medium whitespace-pre-wrap">{appointment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            {appointment.payment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium text-lg">
                      ${Number(appointment.payment.appointmentPrice).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant="outline"
                      className={
                        appointment.payment.patientPaid
                          ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                          : appointment.payment.status === "PENDING"
                          ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                          : "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
                      }
                    >
                      {appointment.payment.refunded ? (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Refunded
                        </>
                      ) : appointment.payment.patientPaid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Paid
                        </>
                      ) : (
                        "Unpaid"
                      )}
                    </Badge>
                  </div>
                  {appointment.payment.refunded && appointment.payment.refundAmount && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Refund Amount</p>
                      <p className="font-medium text-red-600 dark:text-red-400">
                        -${Number(appointment.payment.refundAmount).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {appointment.payment.patientPaidAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <CheckCircle2 className="w-3 h-3" />
                      Paid on {format(new Date(appointment.payment.patientPaidAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  )}
                  {!appointment.payment.patientPaid && appointment.status !== "CANCELLED" && (
                    <Button variant="outline" className="w-full mt-4" asChild>
                      <Link href={`/patient/payments?appointmentId=${appointment.id}`}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Make Payment
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Prescription Link */}
            {appointment.prescription && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Prescription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    A prescription was issued for this appointment.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/patient/prescriptions/${appointment.prescription.id}`}>
                      <FileText className="w-4 h-4 mr-2" />
                      View Prescription
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canCancel && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setCancelConfirmOpen(true)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Appointment
                  </Button>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/patient/appointments">View All Appointments</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/patient/appointments/book">Book New Appointment</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Important Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p>• Please arrive 15 minutes early</p>
                <p>• Bring a valid ID</p>
                <p>• Cancel at least 24 hours in advance</p>
                {appointment.status === "CONFIRMED" && (
                  <p className="text-primary font-medium mt-3">
                    <CheckCircle2 className="w-4 h-4 inline mr-1" />
                    This appointment is confirmed
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Appointment Confirmation */}
      <ConfirmDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this appointment? You may be able to reschedule instead."
        warningText="If you cancel less than 24 hours before your appointment, cancellation fees may apply according to the doctor's policy."
        confirmLabel="Cancel Appointment"
        cancelLabel="Keep Appointment"
        variant="destructive"
        onConfirm={handleCancel}
      />
    </PatientDashboardLayout>
  );
}

