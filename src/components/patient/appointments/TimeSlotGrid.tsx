"use client";

import { Button } from "@/components/ui/button";
import { ClockIcon } from "lucide-react";

interface TimeSlotGridProps {
    slots: string[];
    selectedTime: string;
    onTimeSelect: (time: string) => void;
    isLoading?: boolean;
}

export function TimeSlotGrid({ slots, selectedTime, onTimeSelect, isLoading }: TimeSlotGridProps) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading available times...
            </div>
        );
    }

    if (slots.length === 0) {
        return (
            <div className="p-4 border rounded-lg bg-muted/30 text-center text-sm text-muted-foreground">
                No available time slots for this date. Please try another day.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slots.map((time) => (
                <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => onTimeSelect(time)}
                    size="sm"
                    className="min-h-[44px] touch-manipulation"
                >
                    <ClockIcon className="w-3 h-3 mr-1" />
                    {time}
                </Button>
            ))}
        </div>
    );
}
