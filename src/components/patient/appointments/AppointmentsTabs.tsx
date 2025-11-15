"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, List } from "lucide-react";
import { AppointmentFilter } from "./AppointmentsList";

export interface AppointmentsTabsProps {
  activeTab: AppointmentFilter;
  onTabChange?: (tab: AppointmentFilter) => void;
  counts?: {
    all: number;
    upcoming: number;
    completed: number;
  };
  children: React.ReactNode;
}

export default function AppointmentsTabs({
  activeTab,
  onTabChange,
  counts = { all: 0, upcoming: 0, completed: 0 },
  children,
}: AppointmentsTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange?.(value as AppointmentFilter)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="all" className="relative">
          <List className="w-4 h-4 mr-2" />
          All
          {counts.all > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
              {counts.all}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="upcoming" className="relative">
          <Calendar className="w-4 h-4 mr-2" />
          Upcoming
          {counts.upcoming > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
              {counts.upcoming}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="completed" className="relative">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Completed
          {counts.completed > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
              {counts.completed}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value={activeTab} className="mt-0">
        {children}
      </TabsContent>
    </Tabs>
  );
}

