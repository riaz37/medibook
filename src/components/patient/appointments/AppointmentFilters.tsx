"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Filter, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type StatusFilter = "all" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "PENDING";

export interface AppointmentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  onClearFilters: () => void;
}

export default function AppointmentFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
}: AppointmentFiltersProps) {
  const hasActiveFilters = search !== "" || statusFilter !== "all";

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search appointments, doctors, or reasons..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            onClick={() => onSearchChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            Status
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                1
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={statusFilter}
            onValueChange={(value) => onStatusFilterChange(value as StatusFilter)}
          >
            <DropdownMenuRadioItem value="all">All Status</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="CONFIRMED">Confirmed</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="PENDING">Pending</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="COMPLETED">Completed</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="CANCELLED">Cancelled</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" onClick={onClearFilters} className="w-full sm:w-auto">
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  );
}

