"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDoctorSettingsStore } from "@/lib/stores/doctor-settings.store";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Calendar } from "lucide-react";
import { toast } from "sonner";

interface WorkingHoursSettingsProps {
  doctorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  const queryClient = useQueryClient();
  const { workingHours, updateWorkingHour, initializeFromConfig, isLoading: storeLoading } = useDoctorSettingsStore();

  const { data: config, isLoading: queryLoading } = useQuery({
    queryKey: ["doctorConfig", doctorId],
    queryFn: async () => {
      const response = await fetch(`/api/doctors/${doctorId}/config`);
      if (!response.ok) throw new Error("Failed to fetch config");
      return response.json();
    },
    enabled: open,
  });

  useEffect(() => {
    if (config && open) {
      const defaultHours = DAYS_OF_WEEK.map((day) => {
        const existing = config.workingHours?.find((wh: any) => wh.dayOfWeek === day.value);
        return existing || {
          dayOfWeek: day.value,
          startTime: "09:00",
          endTime: "17:00",
          isWorking: day.value !== 0 && day.value !== 6,
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

  const updateWorkingHoursMutation = useMutation({
    mutationFn: async (hours: typeof workingHours) => {
      const response = await fetch(`/api/doctors/${doctorId}/working-hours`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workingHours: hours }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update working hours");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Working hours updated successfully");
      queryClient.invalidateQueries({ queryKey: ["doctorConfig", doctorId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleUpdateWorkingHours = (dayOfWeek: number, field: string, value: any) => {
    updateWorkingHour(dayOfWeek, field as any, value);
  };

  const handleSave = () => {
    updateWorkingHoursMutation.mutate(workingHours);
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
                        value={wh.startTime}
                        onChange={(e) =>
                          handleUpdateWorkingHours(wh.dayOfWeek, "startTime", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">End Time</Label>
                      <Input
                        type="time"
                        value={wh.endTime}
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

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateWorkingHoursMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateWorkingHoursMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

