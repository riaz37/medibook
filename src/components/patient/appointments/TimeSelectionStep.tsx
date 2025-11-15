import { useBookedTimeSlots } from "@/hooks/use-appointment";
import { useDoctorAppointmentTypes, useDoctorAvailableSlots, useDoctorConfig } from "@/hooks/use-doctor-config";
import { getNextDays } from "@/lib/config/app.config";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ClockIcon, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { toast } from "sonner";

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
  
  // Fetch doctor's configuration for booking advance days
  const { data: doctorConfig } = useDoctorConfig(selectedDentistId);
  const bookingAdvanceDays = doctorConfig?.availability?.bookingAdvanceDays || 30;
  
  // Fetch available slots for selected date
  const { data: availableTimeSlots = [], isLoading: isLoadingSlots } = useDoctorAvailableSlots(
    selectedDentistId,
    selectedDate
  );
  
  // Get available dates based on doctor's booking advance days
  const availableDates = getNextDays(bookingAdvanceDays);
  const [showTypeError, setShowTypeError] = useState(false);

  const handleDateSelect = (date: string) => {
    onDateChange(date);
    // reset time when the date changes
    onTimeChange("");
  };

  const handleContinue = () => {
    if (!selectedType) {
      setShowTypeError(true);
      toast.error("Please select an appointment type to continue");
      return;
    }
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }
    if (!selectedTime) {
      toast.error("Please select a time");
      return;
    }
    setShowTypeError(false);
    onContinue();
  };

  return (
    <div className="space-y-6">
      {/* header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeftIcon className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h2 className="text-2xl font-semibold">Select Date & Time</h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* appointment type selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">Appointment Type</h3>
            <span className="text-sm text-destructive">*</span>
          </div>
          {isLoadingTypes ? (
            <div className="text-sm text-muted-foreground">Loading appointment types...</div>
          ) : appointmentTypes.length === 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No appointment types available. Please contact the doctor or select another doctor.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {showTypeError && !selectedType && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please select an appointment type to continue.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-3">
                {appointmentTypes.map((type: { id: string; name: string; duration: number; price: number | null; description: string | null }) => (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all hover:shadow-sm ${
                      selectedType === type.id ? "ring-2 ring-primary" : showTypeError ? "ring-2 ring-destructive" : ""
                    }`}
                    onClick={() => {
                      onTypeChange(type.id);
                      setShowTypeError(false);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{type.name}</h4>
                          <p className="text-sm text-muted-foreground">{type.duration} minutes</p>
                          {type.description && (
                            <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                          )}
                        </div>
                        {type.price && (
                          <span className="font-semibold text-primary">${type.price}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        {/* date & time selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Available Dates</h3>

          {/* date Selection */}
          <div className="grid grid-cols-2 gap-3">
            {availableDates.map((date) => (
              <Button
                key={date}
                variant={selectedDate === date ? "default" : "outline"}
                onClick={() => handleDateSelect(date)}
                className="h-auto p-3"
              >
                <div className="text-center">
                  <div className="font-medium">
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </Button>
            ))}
          </div>

          {/* time Selection (only show when date is selected) */}
          {selectedDate && (
            <div className="space-y-3">
              <h4 className="font-medium">Available Times</h4>
              {isLoadingSlots ? (
                <div className="text-sm text-muted-foreground">Loading available times...</div>
              ) : availableTimeSlots.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No available time slots for this date.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableTimeSlots.map((time: string) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      onClick={() => onTimeChange(time)}
                      size="sm"
                    >
                      <ClockIcon className="w-3 h-3 mr-1" />
                      {time}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* continue button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleContinue}
          disabled={!selectedDate || !selectedTime || appointmentTypes.length === 0}
        >
          Review Booking
        </Button>
      </div>
      
      {/* Show message if selections incomplete */}
      {(!selectedDate || !selectedTime || !selectedType) && (
        <div className="text-sm text-muted-foreground text-center">
          Please select appointment type, date, and time to continue
        </div>
      )}
    </div>
  );
}

export default TimeSelectionStep;
