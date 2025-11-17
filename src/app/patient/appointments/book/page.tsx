"use client";

import { AppointmentConfirmationModal } from "@/components/shared/appointments/AppointmentConfirmationModal";
import BookingConfirmationStep from "@/components/patient/appointments/BookingConfirmationStep";
import DoctorSelectionStep from "@/components/patient/appointments/DoctorSelectionStep";
import ProgressSteps from "@/components/patient/appointments/ProgressSteps";
import TimeSelectionStep from "@/components/patient/appointments/TimeSelectionStep";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import { useBookAppointment } from "@/hooks/use-appointment";
import { useDoctorAppointmentTypes } from "@/hooks/use-doctor-config";
import { useAppointmentBookingStore } from "@/lib/stores/appointment-booking.store";
import { format } from "date-fns";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usersService } from "@/lib/services";
import { useUser } from "@clerk/nextjs";

function BookAppointmentPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Redirect doctors away from appointments page
  useEffect(() => {
    if (isLoaded && user) {
      usersService.syncUserClient().then((syncedUser) => {
        if (syncedUser?.role) {
          setUserRole(syncedUser.role);
          if (syncedUser.role === "DOCTOR") {
            router.push("/doctor/dashboard");
          }
        }
      });
    }
  }, [isLoaded, user, router]);

  // Don't render if user is a doctor (will redirect)
  if (userRole === "DOCTOR") {
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
    setSelectedDoctorId,
    setSelectedDate,
    setSelectedTime,
    setSelectedAppointmentTypeId,
    setCurrentStep,
    setShowConfirmationModal,
    setBookedAppointment,
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
      toast.error("Please fill in all required fields");
      return;
    }

    if (!selectedAppointmentTypeId) {
      toast.error("Please select an appointment type");
      return;
    }

    const typedAppointmentTypes = appointmentTypes as any[];
    const appointmentType = typedAppointmentTypes.find((t: { id: string }) => t.id === selectedAppointmentTypeId);
    
    if (!appointmentType) {
      toast.error("Selected appointment type not found. Please try again.");
      return;
    }

    bookAppointmentMutation.mutate(
      {
        doctorId: selectedDoctorId,
        date: selectedDate,
        time: selectedTime,
        reason: appointmentType?.name || "Appointment",
        appointmentTypeId: selectedAppointmentTypeId, // Link to appointment type
      },
      {
        onSuccess: async (appointment) => {
          // store the appointment details to show in the modal
          setBookedAppointment(appointment);

          // Email is now sent server-side automatically
          // No need to make a separate API call

          // show the success modal
          setShowConfirmationModal(true);

          // reset form after successful booking
          resetBooking();
        },
        onError: (error) => toast.error(`Failed to book appointment: ${error.message}`),
      }
    );
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

