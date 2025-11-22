"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDoctorConfig, useUpdateDoctorConfig } from "@/hooks";
import { useDoctorSettingsStore } from "@/lib/stores/doctor-settings.store";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Clock } from "lucide-react";
import { showSuccess, showError, handleApiError, toastMessages } from "@/lib/utils/toast";
import type { AvailabilitySettingsProps } from "@/lib/types";

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00",
];

export default function AvailabilitySettings({ doctorId, open, onOpenChange }: AvailabilitySettingsProps) {
  const queryClient = useQueryClient();
  const { availability, setAvailability, initializeFromConfig, isLoading: storeLoading } = useDoctorSettingsStore();

  const { data: config, isLoading: queryLoading } = useDoctorConfig(open ? doctorId : null);

  useEffect(() => {
    if (config && open) {
      initializeFromConfig({
        availability: {
          timeSlots: config.availability?.timeSlots || [],
          slotDuration: config.availability?.slotDuration || 30,
          bookingAdvanceDays: config.availability?.bookingAdvanceDays || 30,
          minBookingHours: config.availability?.minBookingHours || 24,
        },
        workingHours: [],
        appointmentTypes: [],
      });
    }
  }, [config, open, initializeFromConfig]);

  const updateConfigMutation = useUpdateDoctorConfig();
  
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (data: typeof availability) => {
      return updateConfigMutation.mutateAsync({
        doctorId,
        data: {
          slotDuration: data.slotDuration,
          bookingAdvanceDays: data.bookingAdvanceDays,
          minBookingHours: data.minBookingHours,
          timeSlots: data.timeSlots,
        },
      });
    },
    onSuccess: () => {
      showSuccess(toastMessages.success.settingsSaved);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      const errorMessage = handleApiError(error, toastMessages.error.settingsSaveFailed);
      showError(errorMessage);
    },
  });

  const handleToggleTimeSlot = (slot: string) => {
    const newTimeSlots = availability.timeSlots.includes(slot)
      ? availability.timeSlots.filter((s) => s !== slot)
      : [...availability.timeSlots, slot];
    setAvailability({ timeSlots: newTimeSlots });
  };

  const handleSave = () => {
    updateAvailabilityMutation.mutate(availability);
  };

  if (queryLoading || storeLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Availability Settings
          </DialogTitle>
          <DialogDescription>
            Configure your time slots and booking preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="slotDuration">Slot Duration (minutes)</Label>
              <Input
                id="slotDuration"
                type="number"
                min="15"
                max="120"
                step="15"
                value={availability.slotDuration}
                onChange={(e) =>
                  setAvailability({
                    ...availability,
                    slotDuration: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="bookingAdvanceDays">Booking Advance Days</Label>
              <Input
                id="bookingAdvanceDays"
                type="number"
                min="1"
                max="365"
                value={availability.bookingAdvanceDays}
                onChange={(e) =>
                  setAvailability({
                    ...availability,
                    bookingAdvanceDays: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="minBookingHours">Min Booking Hours</Label>
              <Input
                id="minBookingHours"
                type="number"
                min="1"
                max="168"
                value={availability.minBookingHours}
                onChange={(e) =>
                  setAvailability({
                    ...availability,
                    minBookingHours: parseInt(e.target.value) || 24,
                  })
                }
              />
            </div>
          </div>

          <div>
            <Label>Available Time Slots</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Select the time slots when you're available for appointments
            </p>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {TIME_SLOTS.map((slot) => (
                <Button
                  key={slot}
                  type="button"
                  variant={availability.timeSlots.includes(slot) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToggleTimeSlot(slot)}
                >
                  {slot}
                </Button>
              ))}
            </div>
            {availability.timeSlots.length === 0 && (
              <Alert className="mt-4">
                <AlertDescription>
                  No time slots selected. All slots within working hours will be available.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateAvailabilityMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateAvailabilityMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

