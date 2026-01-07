"use client";

import { useState, useEffect } from "react";
import { useDoctorSettingsStore } from "@/lib/stores/doctor-settings.store";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Calendar } from "lucide-react";
import { useDoctorConfig, useUpdateDoctorWorkingHours } from "@/hooks";
import { showSuccess, showError, handleApiError, toastMessages } from "@/lib/utils/toast";
import type { WorkingHoursSettingsProps } from "@/lib/types";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function WorkingHoursSettings({ doctorId, open, onOpenChange }: WorkingHoursSettingsProps) {
  const { workingHours, updateWorkingHour, initializeFromConfig, isLoading: storeLoading } = useDoctorSettingsStore();

  const { data: config, isLoading: queryLoading } = useDoctorConfig(open ? doctorId : null);

  useEffect(() => {
    if (config && open) {
      const defaultHours = DAYS_OF_WEEK.map((day) => {
        const existing = config.workingHours?.find((wh) => wh.dayOfWeek === day.value);
        if (existing) {
          return {
            dayOfWeek: existing.dayOfWeek,
            startTime: existing.startTime || null,
            endTime: existing.endTime || null,
            isWorking: existing.isWorking,
          };
        }
        const isWorking = day.value !== 0 && day.value !== 6;
        return {
          dayOfWeek: day.value,
          startTime: isWorking ? "09:00" : null,
          endTime: isWorking ? "17:00" : null,
          isWorking,
        };
      });

      initializeFromConfig({
        availability: {
          timeSlots: [],
          slotDuration: 30,
          bookingAdvanceDays: 30,
          minBookingHours: 24,
        },
        workingHours: defaultHours,
        appointmentTypes: [],
      });
    }
  }, [config, open, initializeFromConfig]);

  const updateWorkingHoursMutation = useUpdateDoctorWorkingHours();

  const handleUpdateWorkingHours = (dayOfWeek: number, field: string, value: any) => {
    if (field === "isWorking" && !value) {
      // When setting isWorking to false, clear startTime and endTime
      updateWorkingHour(dayOfWeek, "isWorking", false);
      updateWorkingHour(dayOfWeek, "startTime", null);
      updateWorkingHour(dayOfWeek, "endTime", null);
    } else {
      updateWorkingHour(dayOfWeek, field as any, value);
    }
  };

  const handleSave = () => {
    // Normalize data: ensure non-working days have null for startTime/endTime
    const normalizedHours = workingHours.map((wh) => ({
      dayOfWeek: wh.dayOfWeek,
      isWorking: wh.isWorking,
      startTime: wh.isWorking ? wh.startTime || null : null,
      endTime: wh.isWorking ? wh.endTime || null : null,
    }));

    updateWorkingHoursMutation.mutate(
      { doctorId, data: normalizedHours },
      {
        onSuccess: () => {
          showSuccess(toastMessages.success.settingsSaved);
          onOpenChange(false);
        },
        onError: (error: Error) => {
          const errorMessage = handleApiError(error, toastMessages.error.settingsSaveFailed);
          showError(errorMessage);
        },
      }
    );
  };

  if (queryLoading || storeLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Working Hours</DialogTitle>
          </DialogHeader>
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
            <Calendar className="w-5 h-5" />
            Working Hours
          </DialogTitle>
          <DialogDescription>
            Set your working hours for each day of the week
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {workingHours.map((wh) => {
            const day = DAYS_OF_WEEK.find((d) => d.value === wh.dayOfWeek);
            return (
              <div
                key={wh.dayOfWeek}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Switch
                    checked={wh.isWorking}
                    onCheckedChange={(checked) =>
                      handleUpdateWorkingHours(wh.dayOfWeek, "isWorking", checked)
                    }
                  />
                  <Label className="font-medium">{day?.label}</Label>
                </div>
                {wh.isWorking && (
                  <>
                    <div className="flex-1">
                      <Label className="text-xs">Start Time</Label>
                      <Input
                        type="time"
                        value={wh.startTime || ""}
                        onChange={(e) =>
                          handleUpdateWorkingHours(wh.dayOfWeek, "startTime", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">End Time</Label>
                      <Input
                        type="time"
                        value={wh.endTime || ""}
                        onChange={(e) =>
                          handleUpdateWorkingHours(wh.dayOfWeek, "endTime", e.target.value)
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateWorkingHoursMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateWorkingHoursMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

