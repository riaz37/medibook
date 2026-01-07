"use client";

import { Button } from "@/components/ui/button";
import { Trash2, LayoutGrid, List } from "lucide-react";

interface AppointmentsHeaderProps {
    todaysAppointmentsCount: number;
    onBulkCancel: () => void;
    viewMode: "calendar" | "list";
    onViewModeChange: (mode: "calendar" | "list") => void;
}

export function AppointmentsHeader({
    todaysAppointmentsCount,
    onBulkCancel,
    viewMode,
    onViewModeChange,
}: AppointmentsHeaderProps) {
    return (
        <div className="mb-8 flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold mb-2">Appointments</h1>
                <p className="text-muted-foreground">
                    Manage your appointments, confirm pending requests, and track your schedule
                </p>
            </div>
            <div className="flex items-center gap-2">
                {todaysAppointmentsCount > 0 && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={onBulkCancel}
                        className="h-9 px-3"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancel All Today ({todaysAppointmentsCount})
                    </Button>
                )}
                <div className="flex items-center gap-2 border rounded-md p-1 bg-background">
                    <Button
                        variant={viewMode === "calendar" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onViewModeChange("calendar")}
                        className="h-9 px-3"
                    >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Calendar
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onViewModeChange("list")}
                        className="h-9 px-3"
                    >
                        <List className="h-4 w-4 mr-2" />
                        List
                    </Button>
                </div>
            </div>
        </div>
    );
}
