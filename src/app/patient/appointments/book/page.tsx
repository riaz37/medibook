"use client";

import { AppointmentConfirmationModal } from "@/components/shared/appointments/AppointmentConfirmationModal";
import BookingConfirmationStep from "@/components/patient/appointments/BookingConfirmationStep";
import DoctorSelectionStep from "@/components/patient/appointments/DoctorSelectionStep";
import ProgressSteps from "@/components/patient/appointments/ProgressSteps";
import TimeSelectionStep from "@/components/patient/appointments/TimeSelectionStep";
import PaymentStep from "@/components/patient/appointments/PaymentStep";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import { useBookAppointment } from "@/hooks/use-appointment";
import { useDoctorAppointmentTypes } from "@/hooks/use-doctor-config";
import { useAppointmentBookingStore } from "@/lib/stores/appointment-booking.store";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useRole } from "@/hooks/use-auth";
import { showError, handleApiError, toastMessages } from "@/lib/utils/toast";

function BookAppointmentPage() {
  const router = useRouter();
  const { isLoaded } = useUser();
  const role = useRole();

  // Redirect doctors away from appointments page
  useEffect(() => {
    if (isLoaded && role === "doctor") {
      router.push("/doctor/dashboard");
    }
  }, [isLoaded, role, router]);

  // Don't render if user is a doctor (will redirect)
  if (role === "doctor") {
    return null;
  }

  // Use Zustand store for booking state management
  const {
    selectedDoctorId,
    selectedDate,
    selectedTime,
    selectedAppointmentTypeId,
    currentStep,
    showConfirmationModal,
    bookedAppointment,
    createdAppointmentId,
    setSelectedDoctorId,
    setSelectedDate,
    setSelectedTime,
    setSelectedAppointmentTypeId,
    setCurrentStep,
    setShowConfirmationModal,
    setBookedAppointment,
    setCreatedAppointmentId,
    goToNextStep,
    goToPreviousStep,
    resetBooking,
  } = useAppointmentBookingStore();

  const bookAppointmentMutation = useBookAppointment();
  const { data: appointmentTypes = [] } = useDoctorAppointmentTypes(selectedDoctorId);

  const handleSelectDoctor = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    // resetAfterDoctorChange is automatically called by the store
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctorId || !selectedDate || !selectedTime) {
      showError(toastMessages.error.validationError);
      return;
    }

    if (!selectedAppointmentTypeId) {
      showError("Please select an appointment type");
      return;
    }

    const typedAppointmentTypes = appointmentTypes as any[];
    const appointmentType = typedAppointmentTypes.find((t: { id: string }) => t.id === selectedAppointmentTypeId);
    
    if (!appointmentType) {
      showError("Selected appointment type not found. Please try again.");
      return;
    }

    // Check if appointment type has a price (payment required)
    if (appointmentType.price && appointmentType.price > 0) {
      // Create appointment first, then proceed to payment
      bookAppointmentMutation.mutate(
        {
          doctorId: selectedDoctorId,
          date: selectedDate,
          time: selectedTime,
          reason: appointmentType?.name || "Appointment",
          appointmentTypeId: selectedAppointmentTypeId,
        },
        {
          onSuccess: async (appointment) => {
            // Store appointment ID for payment step
            setCreatedAppointmentId(appointment.id);
            // Proceed to payment step
            goToNextStep();
          },
          onError: (error) => {
            const errorMessage = handleApiError(error, toastMessages.error.appointmentBookFailed);
            showError(errorMessage);
          },
        }
      );
    } else {
      // No price - create appointment without payment (free appointment)
      bookAppointmentMutation.mutate(
        {
          doctorId: selectedDoctorId,
          date: selectedDate,
          time: selectedTime,
          reason: appointmentType?.name || "Appointment",
          appointmentTypeId: selectedAppointmentTypeId,
        },
        {
          onSuccess: async (appointment) => {
            setBookedAppointment(appointment);
            setShowConfirmationModal(true);
            resetBooking();
          },
          onError: (error) => {
            const errorMessage = handleApiError(error, toastMessages.error.appointmentBookFailed);
            showError(errorMessage);
          },
        }
      );
    }
  };

  return (
    <PatientDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        {/* header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Book an Appointment</h1>
          <p className="text-muted-foreground">Find and book with verified doctors in your area</p>
        </div>

        <ProgressSteps currentStep={currentStep} />

        {currentStep === 1 && (
          <DoctorSelectionStep
            selectedDentistId={selectedDoctorId}
            onContinue={goToNextStep}
            onSelectDentist={handleSelectDoctor}
          />
        )}

        {currentStep === 2 && selectedDoctorId && (
          <TimeSelectionStep
            selectedDentistId={selectedDoctorId}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedType={selectedAppointmentTypeId}
            onBack={goToPreviousStep}
            onContinue={goToNextStep}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
            onTypeChange={setSelectedAppointmentTypeId}
          />
        )}

        {currentStep === 3 && selectedDoctorId && (
          <BookingConfirmationStep
            selectedDentistId={selectedDoctorId}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedType={selectedAppointmentTypeId}
            isBooking={bookAppointmentMutation.isPending}
            onBack={goToPreviousStep}
            onModify={() => setCurrentStep(2)}
            onConfirm={handleBookAppointment}
          />
        )}

        {currentStep === 4 && selectedDoctorId && createdAppointmentId && (
          <PaymentStep
            selectedDentistId={selectedDoctorId}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedType={selectedAppointmentTypeId}
            onBack={goToPreviousStep}
          />
        )}
      </div>

      {bookedAppointment && (
        <AppointmentConfirmationModal
          open={showConfirmationModal}
          onOpenChange={setShowConfirmationModal}
          appointmentDetails={{
            doctorName: bookedAppointment.doctorName,
            appointmentDate: format(new Date(bookedAppointment.date), "EEEE, MMMM d, yyyy"),
            appointmentTime: bookedAppointment.time,
            userEmail: bookedAppointment.patientEmail,
          }}
        />
      )}
    </PatientDashboardLayout>
  );
}

export default BookAppointmentPage;

