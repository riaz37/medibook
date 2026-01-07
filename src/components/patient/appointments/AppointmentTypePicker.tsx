"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import type { DoctorAppointmentType } from "@/lib/types/doctor-config";

interface AppointmentTypePickerProps {
    types: DoctorAppointmentType[];
    selectedType: string;
    onTypeSelect: (typeId: string) => void;
    isLoading?: boolean;
    showError?: boolean;
}

export function AppointmentTypePicker({
    types,
    selectedType,
    onTypeSelect,
    isLoading,
    showError,
}: AppointmentTypePickerProps) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading appointment types...
            </div>
        );
    }

    if (types.length === 0) {
        return (
            <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-center text-sm text-destructive">
                No appointment types available. Please contact the doctor or select another doctor.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {types.map((type) => (
                <Card
                    key={type.id}
                    className={`cursor-pointer transition-all hover:shadow-sm focus-within:ring-2 focus-within:ring-primary ${selectedType === type.id
                            ? "ring-2 ring-primary border-primary/60 bg-primary/5"
                            : showError
                                ? "ring-2 ring-destructive"
                                : ""
                        }`}
                    onClick={() => onTypeSelect(type.id)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onTypeSelect(type.id);
                        }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select ${type.name} appointment, ${type.duration} minutes${type.price ? `, $${type.price}` : ""}`}
                    aria-pressed={selectedType === type.id}
                >
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h4 className="font-medium">{type.name}</h4>
                                <p className="text-sm text-muted-foreground">{type.duration} minutes</p>
                                {type.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                                )}
                            </div>
                            <div className="text-right">
                                {type.price && <span className="font-semibold text-primary">${type.price}</span>}
                                {selectedType === type.id && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                        <CheckCircle2 className="w-3 h-3 text-primary" />
                                        Selected
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
