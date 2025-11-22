"use client";

import React, { useEffect } from "react";
import { useAdminRevenue } from "@/hooks";
import { showErrorToast } from "@/components/shared/ErrorToast";
import { handleApiError } from "@/lib/utils/toast";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { DollarSign, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--primary)",
  },
  commission: {
    label: "Commission",
    color: "var(--secondary)",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

export function RevenueChart() {
  const [period, setPeriod] = React.useState("30");
  const { data, isLoading, isError, error } = useAdminRevenue(period);

  useEffect(() => {
    if (isError && error) {
      const errorMessage = handleApiError(error, "Failed to load revenue data");
      showErrorToast({ message: errorMessage, retry: () => window.location.reload() });
    }
  }, [isError, error]);

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

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Trends
          </CardTitle>
          <CardDescription>Platform revenue analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={DollarSign}
            title="Failed to load revenue data"
            description="Please try refreshing the page or contact support if the issue persists."
            action={{
              label: "Refresh",
              onClick: () => window.location.reload(),
            }}
          />
        </CardContent>
      </Card>
    );
  }

  if (!data || typeof data !== "object" || !("data" in data) || !Array.isArray((data as { data: unknown[] }).data) || (data as { data: unknown[] }).data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Trends
          </CardTitle>
          <CardDescription>Platform revenue analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={DollarSign}
            title="No revenue data yet"
            description="Revenue trends will appear here once transactions are processed."
          />
        </CardContent>
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
              Revenue Trends
            </CardTitle>
            <CardDescription>
              Platform revenue and commission over the last {period} days
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
              <BarChart
                data={(data && typeof data === "object" && "data" in data && Array.isArray((data as { data: any[] }).data)) ? (data as { data: any[] }).data : []}
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
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="commission"
                  fill="var(--color-commission)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

