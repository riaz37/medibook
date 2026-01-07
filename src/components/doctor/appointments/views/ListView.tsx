import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AppointmentFilters } from "@/components/doctor/appointments/AppointmentFilters";
import { DoctorAppointmentCard } from "@/components/doctor/appointments/DoctorAppointmentCard";
import { PageLoading } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar } from "lucide-react";
import type { DoctorAppointmentListItem } from "@/lib/types/appointments";
import type { AppointmentStatus } from "../hooks/useAppointmentsLogic";

interface ListViewProps {
    activeTab: AppointmentStatus;
    onTabChange: (tab: AppointmentStatus) => void;
    counts: { all: number; pending: number; upcoming: number; completed: number };
    appointments: DoctorAppointmentListItem[];
    isLoading: boolean;
    filters: {
        searchQuery: string;
        setSearchQuery: (query: string) => void;
        statusFilter: string;
        setStatusFilter: (status: string) => void;
        handleClearFilters: () => void;
        hasActiveFilters: boolean;
    };
    onAppointmentClick: (appointment: DoctorAppointmentListItem) => void;
}

export function ListView({
    activeTab,
    onTabChange,
    counts,
    appointments,
    isLoading,
    filters,
    onAppointmentClick
}: ListViewProps) {
    return (
        <div className="col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Appointments</CardTitle>
                    <CardDescription>View and manage all your appointments in a list</CardDescription>
                </CardHeader>
                <CardContent>
                    <AppointmentFilters
                        searchQuery={filters.searchQuery}
                        onSearchQueryChange={filters.setSearchQuery}
                        statusFilter={filters.statusFilter}
                        onStatusFilterChange={filters.setStatusFilter}
                        onClearFilters={filters.handleClearFilters}
                        hasActiveFilters={filters.hasActiveFilters}
                    />

                    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as AppointmentStatus)} className="mt-6">
                        <TabsList className="mb-4">
                            <TabsTrigger value="all">
                                All
                                {counts.all > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {counts.all}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="pending">
                                Pending
                                {counts.pending > 0 && (
                                    <Badge variant="destructive" className="ml-2">
                                        {counts.pending}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                            <TabsTrigger value="completed">Completed</TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="space-y-4">
                            {isLoading ? (
                                <PageLoading message="Loading appointments..." />
                            ) : appointments.length === 0 ? (
                                <EmptyState
                                    icon={Calendar}
                                    title="No appointments found"
                                    description={
                                        filters.hasActiveFilters
                                            ? "Try adjusting your filters to find appointments."
                                            : "You don't have any appointments yet."
                                    }
                                    action={
                                        filters.hasActiveFilters
                                            ? {
                                                label: "Clear Filters",
                                                onClick: filters.handleClearFilters,
                                            }
                                            : undefined
                                    }
                                />
                            ) : (
                                <div className="grid gap-4">
                                    {appointments.map((appointment) => (
                                        <DoctorAppointmentCard
                                            key={appointment.id}
                                            appointment={appointment}
                                            onClick={() => onAppointmentClick(appointment)}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
