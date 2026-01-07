"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SearchIcon, XCircleIcon } from "lucide-react";

interface AppointmentFiltersProps {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    onClearFilters: () => void;
    hasActiveFilters: boolean;
}

export function AppointmentFilters({
    searchQuery,
    onSearchQueryChange,
    statusFilter,
    onStatusFilterChange,
    onClearFilters,
    hasActiveFilters,
}: AppointmentFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search appointments..."
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    className="pl-9 pr-8"
                />
                {searchQuery && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:bg-transparent"
                        onClick={() => onSearchQueryChange("")}
                    >
                        <XCircleIcon className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
            </Select>

            {hasActiveFilters && (
                <Button variant="outline" onClick={onClearFilters} className="w-full sm:w-auto">
                    Clear Filters
                </Button>
            )}
        </div>
    );
}
