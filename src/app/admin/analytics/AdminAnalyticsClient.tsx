"use client";

import { useState } from "react";
import { useAdminRevenue } from "@/hooks";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { DollarSign, TrendingUp, Users, Calendar, Building2 } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { format } from "date-fns";
import type { AdminRevenueData, AdminRevenueTrendsData } from "@/lib/types";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--primary)",
  },
  commission: {
    label: "Commission",
    color: "var(--secondary)",
  },
  appointments: {
    label: "Appointments",
    color: "var(--accent)",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

const COLORS = ["var(--primary)", "var(--secondary)", "var(--accent)", "var(--muted-foreground)"];

function AdminAnalyticsClient() {
  const [period, setPeriod] = useState("30");

  const { data: revenueDataResponse, isLoading: revenueLoading } = useAdminRevenue(period);
  const { data: statsDataResponse, isLoading: statsLoading } = useAdminRevenue();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (revenueLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = (statsDataResponse as AdminRevenueData | undefined) || {
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalAppointments: 0,
    recentPayments: [],
  };

  const trendsResponse = revenueDataResponse as AdminRevenueTrendsData | undefined;
  const trendData = trendsResponse?.data || [];

  // Calculate platform metrics
  const totalCommission = stats.totalRevenue || 0;
  const monthlyCommission = stats.monthlyRevenue || 0;
  const totalAppointments = stats.totalAppointments || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Analytics"
        description="Comprehensive insights into platform performance"
        actions={
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
        }
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCommission)}</div>
            <p className="text-xs text-muted-foreground">All-time platform commission</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(monthlyCommission)}</div>
            <p className="text-xs text-muted-foreground">This month's commission</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments}</div>
            <p className="text-xs text-muted-foreground">Completed appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalAppointments > 0
                ? formatCurrency(totalCommission / totalAppointments)
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">Per appointment</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Revenue Breakdown</TabsTrigger>
        </TabsList>
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Platform commission over time</CardDescription>
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
                      dataKey="commission"
                      stroke="var(--color-commission)"
                      fill="var(--color-commission)"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      fill="var(--color-revenue)"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No revenue data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Commission</CardTitle>
                <CardDescription>Platform revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" />
                      <Bar dataKey="commission" fill="var(--color-commission)" />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Monthly breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Chart coming soon
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Latest platform transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentPayments && stats.recentPayments.length > 0 ? (
            <RecentPaymentsTable payments={stats.recentPayments.slice(0, 10)} formatCurrency={formatCurrency} />
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No recent payments
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RecentPaymentsTable({
  payments,
  formatCurrency,
}: {
  payments: AdminRevenueData["recentPayments"];
  formatCurrency: (amount: number) => string;
}) {
  const columns: Column<AdminRevenueData["recentPayments"][0]>[] = [
    {
      key: "doctor",
      header: "Doctor",
      sortable: true,
      accessor: (payment) => (
        <div>
          <p className="font-semibold">{payment.doctor?.name || "Unknown Doctor"}</p>
          <p className="text-sm text-muted-foreground">
            {payment.appointment?.appointmentType?.name || "Appointment"}
          </p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      accessor: (payment) => (
        <span className="text-sm">
          {payment.createdAt ? format(new Date(payment.createdAt), "MMM d, yyyy") : "N/A"}
        </span>
      ),
    },
    {
      key: "revenue",
      header: "Total Revenue",
      sortable: true,
      className: "text-right",
      accessor: (payment) => (
        <div className="text-right">
          <p className="font-semibold">{formatCurrency(Number(payment.patientPaid || 0))}</p>
          <p className="text-xs text-muted-foreground">Patient paid</p>
        </div>
      ),
    },
    {
      key: "commission",
      header: "Commission",
      sortable: true,
      className: "text-right",
      accessor: (payment) => (
        <div className="text-right">
          <p className="font-bold text-primary">{formatCurrency(Number(payment.commissionAmount || 0))}</p>
          <p className="text-xs text-muted-foreground">Platform fee</p>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={payments}
      columns={columns}
      searchable={true}
      searchPlaceholder="Search by doctor name..."
      searchKeys={["doctor.name"]}
      emptyMessage="No recent payments"
    />
  );
}

export default AdminAnalyticsClient;

