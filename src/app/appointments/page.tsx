"use client";

import { AppointmentConfirmationModal } from "@/components/appointments/AppointmentConfirmationModal";
import BookingConfirmationStep from "@/components/appointments/BookingConfirmationStep";
import DoctorSelectionStep from "@/components/appointments/DoctorSelectionStep";
import ProgressSteps from "@/components/appointments/ProgressSteps";
import TimeSelectionStep from "@/components/appointments/TimeSelectionStep";
import Navbar from "@/components/Navbar";
import { useBookAppointment, useUserAppointments } from "@/hooks/use-appointment";
import { useDoctorAppointmentTypes } from "@/hooks/use-doctor-config";
import { useAppointmentBookingStore } from "@/lib/stores/appointment-booking.store";
import { format } from "date-fns";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usersService } from "@/lib/services";
import { useUser } from "@clerk/nextjs";

function AppointmentsPage() {
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
  const { data: userAppointments = [] } = useUserAppointments();
  const { data: appointmentTypes = [] } = useDoctorAppointmentTypes(selectedDoctorId);
  
  // Type assertion for appointments
  type Appointment = {
    id: string;
    doctorName: string;
    doctorImageUrl: string;
    reason: string;
    date: string;
    time: string;
  };
  
  const appointments = (userAppointments as Appointment[]) || [];

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

    const appointmentType = appointmentTypes.find((t: { id: string }) => t.id === selectedAppointmentTypeId);
    
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

          try {
            const emailResponse = await fetch("/api/send-appointment-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userEmail: appointment.patientEmail,
                doctorName: appointment.doctorName,
                appointmentDate: format(new Date(appointment.date), "EEEE, MMMM d, yyyy"),
                appointmentTime: appointment.time,
                appointmentType: appointmentType?.name || "Appointment",
                duration: appointmentType?.duration ? `${appointmentType.duration} minutes` : "30 minutes",
                price: appointmentType?.price ? `$${appointmentType.price}` : "N/A",
              }),
            });

            if (!emailResponse.ok) console.error("Failed to send confirmation email");
          } catch (error) {
            console.error("Error sending confirmation email:", error);
          }

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
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
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

      {/* SHOW EXISTING APPOINTMENTS FOR THE CURRENT USER */}
      {appointments.length > 0 && (
        <div className="mb-8 max-w-7xl mx-auto px-6 py-8">
          <h2 className="text-xl font-semibold mb-4">Your Upcoming Appointments</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="bg-card border rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <img
                      src={appointment.doctorImageUrl}
                      alt={appointment.doctorName}
                      className="size-10 rounded-full"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{appointment.doctorName}</p>
                    <p className="text-muted-foreground text-xs">{appointment.reason}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    📅 {format(new Date(appointment.date), "MMM d, yyyy")}
                  </p>
                  <p className="text-muted-foreground">🕐 {appointment.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default AppointmentsPage;
