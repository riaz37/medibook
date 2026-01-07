import { useDoctorAppointmentTypes, useDoctorAvailableSlots, useDoctorConfig } from "@/hooks/use-doctor-config";
import { getNextDays } from "@/lib/config/app.config";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeftIcon, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMemo, useState } from "react";
import { showError } from "@/lib/utils/toast";
import type { DoctorAppointmentType } from "@/lib/types/doctor-config";
import { useGetDoctorById } from "@/hooks/use-doctors";
import Image from "next/image";
import { format } from "date-fns";
import { DateSelector } from "./DateSelector";
import { TimeSlotGrid } from "./TimeSlotGrid";
import { AppointmentTypePicker } from "./AppointmentTypePicker";

interface TimeSelectionStepProps {
  selectedDentistId: string;
  selectedDate: string;
  selectedTime: string;
  selectedType: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onTypeChange: (type: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

function TimeSelectionStep({
  onBack,
  onContinue,
  onDateChange,
  onTimeChange,
  onTypeChange,
  selectedDate,
  selectedDentistId,
  selectedTime,
  selectedType,
}: TimeSelectionStepProps) {
  // Fetch doctor's appointment types
  const { data: appointmentTypes = [], isLoading: isLoadingTypes } = useDoctorAppointmentTypes(selectedDentistId);
  const typedAppointmentTypes = appointmentTypes as DoctorAppointmentType[];

  // Get selected appointment type details (must be declared before use)
  const selectedTypeDetails = useMemo(
    () => typedAppointmentTypes.find((type) => type.id === selectedType),
    [typedAppointmentTypes, selectedType]
  );

  // Fetch doctor's configuration for booking advance days
  const { data: doctorConfig } = useDoctorConfig(selectedDentistId);
  const bookingAdvanceDays = doctorConfig?.availability?.bookingAdvanceDays || 30;

  // Fetch available slots for selected date (filtered by appointment type duration if selected)
  const selectedTypeDuration = selectedTypeDetails?.duration;
  const { data: availableTimeSlots = [], isLoading: isLoadingSlots } = useDoctorAvailableSlots(
    selectedDentistId,
    selectedDate,
    selectedTypeDuration // Pass duration to filter slots that can accommodate this duration
  );
  const typedAvailableSlots = availableTimeSlots as string[];

  // Get available dates based on doctor's booking advance days
  const availableDates = getNextDays(bookingAdvanceDays);
  const [showTypeError, setShowTypeError] = useState(false);
  const { data: doctorDetails } = useGetDoctorById(selectedDentistId);
  const canContinue = Boolean(selectedDate && selectedTime && selectedTypeDetails);

  const handleDateSelect = (date: string) => {
    onDateChange(date);
    // reset time when the date changes
    onTimeChange("");
  };

  const handleContinue = () => {
    if (!selectedType) {
      setShowTypeError(true);
      showError("Please select an appointment type to continue");
      return;
    }
    if (!selectedDate) {
      showError("Please select a date");
      return;
    }
    if (!selectedTime) {
      showError("Please select a time");
      return;
    }
    setShowTypeError(false);
    onContinue();
  };

  return (
    <div className="space-y-6">
      {/* header with back button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ChevronLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Step {selectedDentistId ? "1" : "2"}</p>
            <h2 className="text-2xl font-semibold">Pick a date & time</h2>
            <p className="text-sm text-muted-foreground">Keep scrolling to choose your preferred slot.</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Need help? <span className="text-primary font-medium">Chat with support</span>
        </p>
      </div>

      <div className="grid xl:grid-cols-[2fr_1fr] gap-8">
        {/* appointment type & date selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Appointment type</CardTitle>
              <CardDescription>Select why you’re visiting so we can prepare the right slot.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showTypeError && !selectedType && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Please select an appointment type to continue.</AlertDescription>
                </Alert>
              )}
              <AppointmentTypePicker
                types={typedAppointmentTypes}
                selectedType={selectedType}
                onTypeSelect={(typeId) => {
                  onTypeChange(typeId);
                  setShowTypeError(false);
                }}
                isLoading={isLoadingTypes}
                showError={showTypeError}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Choose a date</CardTitle>
              <CardDescription>Available dates are based on the doctor’s up-to-date schedule.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DateSelector
                dates={availableDates}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />

              {selectedDate ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Available times</h4>
                    <span className="text-xs text-muted-foreground">Local timezone</span>
                  </div>
                  <TimeSlotGrid
                    slots={typedAvailableSlots}
                    selectedTime={selectedTime}
                    onTimeSelect={onTimeChange}
                    isLoading={isLoadingSlots}
                  />
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>Select a date above to see available times.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button onClick={handleContinue} disabled={!canContinue}>
              Review booking
            </Button>
            {!canContinue && (
              <p className="text-sm text-muted-foreground text-center">
                Please select appointment type, date, and time to continue.
              </p>
            )}
          </div>
        </div>

        {/* summary panel */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Booking summary</CardTitle>
            <CardDescription>We’ll confirm these details on the next screen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {doctorDetails && (
              <div className="flex gap-3">
                <Image
                  src={doctorDetails.imageUrl ?? "/images/doctor-placeholder.png"}
                  alt={doctorDetails.name}
                  width={56}
                  height={56}
                  className="rounded-full object-cover"
                />
                <div>
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">Doctor</p>
                  <p className="font-semibold">{doctorDetails.name}</p>
                  <p className="text-sm text-muted-foreground">{doctorDetails.speciality}</p>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs uppercase text-muted-foreground tracking-wide">Appointment type</p>
              <p className="font-medium">
                {selectedTypeDetails ? selectedTypeDetails.name : "Not selected yet"}
              </p>
              {selectedTypeDetails && (
                <p className="text-sm text-muted-foreground">
                  {selectedTypeDetails.duration} mins
                  {selectedTypeDetails.price ? ` · $${selectedTypeDetails.price}` : " · Free"}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs uppercase text-muted-foreground tracking-wide">Date & time</p>
              {selectedDate && selectedTime ? (
                <p className="font-medium">{`${format(new Date(selectedDate), "EEEE, MMM d")} · ${selectedTime}`}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Not selected yet</p>
              )}
            </div>

            <div className="border rounded-lg p-3 space-y-1 bg-muted/30">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Progress</p>
              <ul className="text-sm space-y-1">
                <li className={selectedType ? "text-foreground" : "text-muted-foreground"}>
                  {selectedType ? "✓" : "•"} Select appointment type
                </li>
                <li className={selectedDate ? "text-foreground" : "text-muted-foreground"}>
                  {selectedDate ? "✓" : "•"} Choose date
                </li>
                <li className={selectedTime ? "text-foreground" : "text-muted-foreground"}>
                  {selectedTime ? "✓" : "•"} Choose time
                </li>
                <li className="text-muted-foreground">Review & confirm</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TimeSelectionStep;
