"use client";

import { Button } from "@/components/ui/button";

interface DateSelectorProps {
    dates: string[];
    selectedDate: string;
    onDateSelect: (date: string) => void;
}

export function DateSelector({ dates, selectedDate, onDateSelect }: DateSelectorProps) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {dates.map((date) => (
                <Button
                    key={date}
                    variant={selectedDate === date ? "default" : "outline"}
                    onClick={() => onDateSelect(date)}
                    className="h-auto p-3 flex flex-col gap-1"
                >
                    <span className="text-xs text-muted-foreground">
                        {new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className="text-base font-semibold">
                        {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                </Button>
            ))}
        </div>
    );
}
