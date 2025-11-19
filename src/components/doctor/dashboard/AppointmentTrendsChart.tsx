"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
  confirmed: {
    label: "Confirmed",
    color: "hsl(var(--chart-2))",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-3))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

async function fetchTrends(period: string) {
  const response = await fetch(`/api/appointments/trends?period=${period}`);
  if (!response.ok) throw new Error("Failed to fetch trends");
  return response.json();
}

export function AppointmentTrendsChart() {
  const [period, setPeriod] = React.useState("7");
  const { data, isLoading } = useQuery({
    queryKey: ["appointmentTrends", period],
    queryFn: () => fetchTrends(period),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Appointment Trends
          </CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Appointment Trends
            </CardTitle>
            <CardDescription>
              Appointment activity over the last {period} days
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={period} onValueChange={setPeriod} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="7">7 Days</TabsTrigger>
            <TabsTrigger value="30">30 Days</TabsTrigger>
            <TabsTrigger value="90">90 Days</TabsTrigger>
          </TabsList>
          <TabsContent value={period}>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <AreaChart
                data={data.data}
                margin={{
                  left: 12,
                  right: 12,
                  top: 12,
                  bottom: 12,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="total"
                  type="monotone"
                  fill="var(--color-total)"
                  fillOpacity={0.2}
                  stroke="var(--color-total)"
                  stackId="1"
                />
                <Area
                  dataKey="confirmed"
                  type="monotone"
                  fill="var(--color-confirmed)"
                  fillOpacity={0.2}
                  stroke="var(--color-confirmed)"
                  stackId="1"
                />
                <Area
                  dataKey="completed"
                  type="monotone"
                  fill="var(--color-completed)"
                  fillOpacity={0.2}
                  stroke="var(--color-completed)"
                  stackId="1"
                />
              </AreaChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

