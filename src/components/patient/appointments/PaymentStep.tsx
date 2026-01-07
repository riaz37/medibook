"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon } from "lucide-react";
import PaymentCheckout from "./PaymentCheckout";
import { useDoctorAppointmentTypes } from "@/hooks/use-doctor-config";
import { useGetDoctorById } from "@/hooks/use-doctors";
import { useAppointmentBookingStore } from "@/lib/stores/appointment-booking.store";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/constants/query-keys";
import { showSuccess, showError } from "@/lib/utils/toast";
import { format } from "date-fns";
import type { PaymentStepProps } from "@/lib/types";

function PaymentStep({
  selectedDentistId,
  selectedDate,
  selectedTime,
  selectedType,
  onBack,
}: PaymentStepProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: appointmentTypes = [] } = useDoctorAppointmentTypes(selectedDentistId);
  const { data: doctor } = useGetDoctorById(selectedDentistId);
  const { createdAppointmentId, setBookedAppointment, setShowConfirmationModal, resetBooking } =
    useAppointmentBookingStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const appointmentType = appointmentTypes.find((t: any) => t.id === selectedType);

  if (!appointmentType || !appointmentType.price) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack}>
            <ChevronLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-semibold">Payment</h2>
        </div>
        <div className="p-6 bg-muted rounded-lg">
          <p className="text-muted-foreground">
            This appointment type doesn't have a price set. Please contact the doctor or select a different appointment type.
          </p>
        </div>
      </div>
    );
  }

  if (!createdAppointmentId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack}>
            <ChevronLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-semibold">Payment</h2>
        </div>
        <div className="p-6 bg-destructive/10 text-destructive rounded-lg">
          <p>Appointment not found. Please go back and try again.</p>
        </div>
      </div>
    );
  }

  const handlePaymentSuccess = async () => {
    setIsProcessing(true);
    try {
      // Fetch the updated appointment with payment info first
      const response = await fetch(`/api/appointments/${createdAppointmentId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch appointment");
      }

      const appointment = await response.json();
      
      // Invalidate and refetch appointments cache to refresh payment status
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments.user() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments.detail(createdAppointmentId) });
      
      // Wait a moment for backend to process payment, then refetch
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refetch user appointments to get updated payment status
      await queryClient.refetchQueries({ queryKey: queryKeys.appointments.user() });
      
      // Set booked appointment for confirmation modal
      setBookedAppointment(appointment);
      setShowConfirmationModal(true);
      
      // Reset booking state
      resetBooking();
      
      showSuccess("Payment successful! Your appointment has been confirmed.");
      
      // Redirect to appointments page after a short delay
      setTimeout(() => {
        router.push("/patient/appointments");
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Payment succeeded but failed to load appointment details. Please check your appointments.";
      showError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    showError(error || "Payment failed. Please try again.");
  };

  const doctorName = doctor?.name || "Doctor";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeftIcon className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-semibold">Complete Payment</h2>
      </div>

      <div className="max-w-2xl">
        {/* Appointment Summary */}
        <div className="mb-6 p-4 bg-muted rounded-lg space-y-2">
          <p className="text-sm text-muted-foreground">Appointment Details</p>
          <p className="font-medium">{appointmentType.name}</p>
          <p className="text-sm">
            {format(new Date(selectedDate), "EEEE, MMMM d, yyyy")} at {selectedTime}
          </p>
          <p className="text-lg font-bold mt-2">Total: ${appointmentType.price}</p>
        </div>

        {/* Payment Checkout */}
        <PaymentCheckout
          appointmentId={createdAppointmentId}
          appointmentPrice={Number(appointmentType.price)}
          doctorId={selectedDentistId}
          doctorName={doctorName}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </div>
    </div>
  );
}

export default PaymentStep;

