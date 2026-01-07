"use client";

import { StatCard } from "@/components/shared/cards/StatCard";
import { Calendar, Users, DollarSign, CheckCircle2 } from "lucide-react";

interface DoctorDashboardStatsProps {
    stats: {
        total: number;
        completed: number;
    };
    todaysAppointmentsCount: number;
    totalRevenue: number;
}

export function DoctorDashboardStats({
    stats,
    todaysAppointmentsCount,
    totalRevenue,
}: DoctorDashboardStatsProps) {
    return (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
            <StatCard
                title="Total Appointments"
                value={stats.total}
                description="All time"
                icon={Calendar}
            />

            <StatCard
                title="Today's Patients"
                value={todaysAppointmentsCount}
                description="Scheduled for today"
                icon={Users}
                className="text-blue-600"
            />

            <StatCard
                title="Total Revenue"
                value={`$${totalRevenue.toFixed(2)}`}
                description="From completed visits"
                icon={DollarSign}
                className="text-green-600"
            />

            <StatCard
                title="Completed"
                value={stats.completed}
                description="Finished appointments"
                icon={CheckCircle2}
            />
        </div>
    );
}
