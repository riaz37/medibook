"use client";

import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";

interface DoctorDashboardHeaderProps {
    doctorName?: string;
}

export function DoctorDashboardHeader({ doctorName }: DoctorDashboardHeaderProps) {
    const router = useRouter();

    return (
        <div className="mb-8 flex items-center justify-between">
            <div>
                <h1 className="text-4xl font-bold mb-2">
                    Welcome back, {doctorName || "Doctor"}
                </h1>
                <p className="text-muted-foreground">
                    Manage your appointments and patients from here
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Button
                    onClick={() => router.push("/doctor/appointments")}
                    className="gap-2 shadow-lg shadow-primary/20"
                    size="lg"
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Start Daily Clinic
                </Button>
            </div>
        </div>
    );
}
