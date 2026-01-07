"use client";

import { useState } from "react";
import { useDoctorBilling, useAppointmentTrends } from "@/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { DollarSign, TrendingUp, BarChart3, Target } from "lucide-react";
import { ChartSkeleton, StatCardGridSkeleton } from "@/components/ui/loading-skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
const chartConfig = {
  total: {
    label: "Total",
    color: "var(--primary)",
  },
  confirmed: {
    label: "Confirmed",
    color: "var(--secondary)",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

interface DoctorAnalyticsSectionProps {
  doctorId: string;
}

export function DoctorAnalyticsSection({ doctorId }: DoctorAnalyticsSectionProps) {
  const [period, setPeriod] = useState("30");

  const now = new Date();
  const { data: analyticsResponse, isLoading } = useDoctorBilling(
    doctorId,
    now.getMonth() + 1,
    now.getFullYear()
  );
  const analytics = analyticsResponse as { totals?: any } | undefined;

  const { data: trendsResponse, isLoading: trendsLoading } = useAppointmentTrends(period);
  const trends = trendsResponse as { data?: any[] } | undefined;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (isLoading || trendsLoading) {
    return (
      <div className="space-y-6">
        <StatCardGridSkeleton count={4} />
        <ChartSkeleton height={300} />
        <ChartSkeleton height={400} />
      </div>
    );
  }

  const totals = (analytics?.totals as any) || {
    totalAppointments: 0,
    completedAppointments: 0,
    grossRevenue: 0,
    totalCommission: 0,
    totalPayouts: 0,
    totalRefunds: 0,
  };

  const trendData = (trends?.data as any[]) || [];

  return (
    <div className="space-y-6">
      {/* Financial Performance KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.totalPayouts)}
            </div>
            <p className="text-xs text-muted-foreground">Net earnings this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Appointment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.completedAppointments > 0
                ? formatCurrency(totals.totalPayouts / totals.completedAppointments)
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">Average earnings per visit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.totalAppointments > 0
                ? Math.round((totals.completedAppointments / totals.totalAppointments) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.completedAppointments} of {totals.totalAppointments} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {trendData.length > 1
                ? `${Math.round(((trendData[trendData.length - 1]?.total || 0) - (trendData[0]?.total || 0)) / Math.max(trendData[0]?.total || 1, 1) * 100)}%`
                : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">Appointment growth this period</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Appointment Volume Trends
              </CardTitle>
              <CardDescription>Track your appointment bookings over time</CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select time period for analytics</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" name="Total" />
                <Bar dataKey="confirmed" fill="var(--color-confirmed)" name="Confirmed" />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No appointment data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Appointment Activity Timeline
          </CardTitle>
          <CardDescription>Daily appointment breakdown for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-total)"
                  fill="var(--color-total)"
                  fillOpacity={0.2}
                  name="Total Appointments"
                />
                <Area
                  type="monotone"
                  dataKey="confirmed"
                  stroke="var(--color-confirmed)"
                  fill="var(--color-confirmed)"
                  fillOpacity={0.2}
                  name="Confirmed"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No appointment data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

