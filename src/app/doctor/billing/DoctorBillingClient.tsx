"use client";

import { useState } from "react";
import { useDoctorBilling } from "@/hooks";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Calendar, DollarSign, TrendingUp, FileText, BarChart3 } from "lucide-react";
import { format, parseISO, startOfDay } from "date-fns";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-skeleton";
import Link from "next/link";
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from "@/lib/utils/export";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { BillingData } from "@/lib/types";

interface DoctorBillingClientProps {
  doctorId: string;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--primary)",
  },
  payout: {
    label: "Payout",
    color: "var(--secondary)",
  },
  commission: {
    label: "Commission",
    color: "var(--accent)",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

function DoctorBillingClient({ doctorId }: DoctorBillingClientProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { data: billingDataResponse, isLoading } = useDoctorBilling(
    doctorId,
    selectedMonth,
    selectedYear
  );
  const billingData = billingDataResponse as BillingData | undefined;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadge = (status: string, refunded: boolean) => {
    if (refunded) {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
          Refunded
        </Badge>
      );
    }
    if (status === "COMPLETED") {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
          Completed
        </Badge>
      );
    }
    if (status === "PENDING") {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          Pending
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground">
        {status}
      </Badge>
    );
  };

  // Generate month options
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2024, i, 1), "MMMM"),
  }));

  // Generate year options (last 3 years + current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totals = (billingData as BillingData | undefined)?.totals || {
    totalAppointments: 0,
    completedAppointments: 0,
    grossRevenue: 0,
    totalCommission: 0,
    totalPayouts: 0,
    totalRefunds: 0,
  };

  const entries = (billingData as BillingData | undefined)?.entries || [];
  const period = (billingData as BillingData | undefined)?.period;

  // Process entries for daily trends chart
  const getDailyTrends = () => {
    if (!period || entries.length === 0) return [];

    const trendsMap: Record<string, { date: string; revenue: number; payout: number; commission: number }> = {};
    
    // Initialize all days in the month
    const startDate = typeof period.start === 'string' ? parseISO(period.start) : new Date(period.start);
    const endDate = typeof period.end === 'string' ? parseISO(period.end) : new Date(period.end);
    const daysInMonth = endDate.getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth(), day);
      const dateKey = format(date, "yyyy-MM-dd");
      trendsMap[dateKey] = {
        date: format(date, "MMM d"),
        revenue: 0,
        payout: 0,
        commission: 0,
      };
    }

    // Aggregate entries by date
    entries.forEach((entry) => {
      if (entry.appointmentDate) {
        const entryDate = typeof entry.appointmentDate === 'string' 
          ? parseISO(entry.appointmentDate) 
          : new Date(entry.appointmentDate);
        const dateKey = format(entryDate, "yyyy-MM-dd");
        if (trendsMap[dateKey]) {
          trendsMap[dateKey].revenue += entry.appointmentPrice;
          trendsMap[dateKey].payout += entry.doctorPayoutAmount;
          trendsMap[dateKey].commission += entry.commissionAmount;
        }
      }
    });

    return Object.values(trendsMap);
  };

  const dailyTrends = getDailyTrends();

  const handleExport = () => {
    if (!entries.length) return;
    exportToCSV(
      entries,
      [
        { key: "patient", label: "Patient", accessor: (e: any) => e.patientName || "N/A" },
        { key: "date", label: "Appointment Date", accessor: (e: any) => e.appointmentDate ? formatDateForExport(e.appointmentDate) : "N/A" },
        { key: "time", label: "Time", accessor: (e: any) => e.appointmentTime || "N/A" },
        { key: "price", label: "Appointment Price", accessor: (e: any) => formatCurrencyForExport(e.appointmentPrice) },
        { key: "commission", label: "Commission", accessor: (e: any) => formatCurrencyForExport(e.commissionAmount) },
        { key: "payout", label: "Your Payout", accessor: (e: any) => formatCurrencyForExport(e.doctorPayoutAmount) },
        { key: "status", label: "Status", accessor: (e: any) => e.refunded ? "Refunded" : e.status },
      ],
      `doctor-billing-${selectedMonth}-${selectedYear}`
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Payments"
        description="View detailed payment transactions, statements, and financial records"
        actions={
          <div className="flex gap-2">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {entries.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export billing statement as CSV</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        }
      />

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.grossRevenue)}</div>
            <p className="text-xs text-muted-foreground">From {totals.totalAppointments} appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              -{formatCurrency(totals.totalCommission)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.grossRevenue > 0 
                ? `${Math.round((totals.totalCommission / totals.grossRevenue) * 100)}% platform fee`
                : "Platform fee"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalPayouts)}</div>
            <p className="text-xs text-muted-foreground">After commission & refunds</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refunds</CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{formatCurrency(totals.totalRefunds)}
            </div>
            <p className="text-xs text-muted-foreground">Total refunded amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends Charts */}
      {entries.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Daily Revenue Trends
              </CardTitle>
              <CardDescription>
                Revenue and payout breakdown for {period && format(typeof period.start === 'string' ? parseISO(period.start) : new Date(period.start), "MMMM yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    fill="var(--color-revenue)"
                    fillOpacity={0.2}
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="payout"
                    stroke="var(--color-payout)"
                    fill="var(--color-payout)"
                    fillOpacity={0.2}
                    name="Your Payout"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue Breakdown
              </CardTitle>
              <CardDescription>
                Gross revenue distribution for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={[
                  { name: "Gross Revenue", revenue: totals.grossRevenue },
                  { name: "Commission", commission: totals.totalCommission },
                  { name: "Net Earnings", payout: totals.totalPayouts },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" name="Gross Revenue" />
                  <Bar dataKey="commission" fill="var(--color-commission)" name="Commission" />
                  <Bar dataKey="payout" fill="var(--color-payout)" name="Net Earnings" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Billing Entries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                {period &&
                  `Billing statement for ${format(new Date(period.start), "MMMM yyyy")}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No payments this month"
              description="Your payment history will appear here once you have completed appointments."
            />
          ) : (
            <BillingTable entries={entries} formatCurrency={formatCurrency} getStatusBadge={getStatusBadge} />
          )}
        </CardContent>
      </Card>

      {/* Quick Link to Analytics */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Want performance insights?</h3>
              <p className="text-sm text-muted-foreground">
                View analytics, trends, and growth metrics for your practice
              </p>
            </div>
            <Link href="/doctor/dashboard">
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BillingTable({
  entries,
  formatCurrency,
  getStatusBadge,
}: {
  entries: BillingData["entries"];
  formatCurrency: (amount: number) => string;
  getStatusBadge: (status: string, refunded: boolean) => React.ReactNode;
}) {
  const columns: Column<BillingData["entries"][0]>[] = [
    {
      key: "patient",
      header: "Patient",
      sortable: true,
      accessor: (entry) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <Calendar className="size-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{entry.patientName || "Unknown Patient"}</p>
            {entry.appointmentDate && entry.appointmentTime && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(entry.appointmentDate), "MMM d, yyyy")} at {entry.appointmentTime}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (entry) => (
        <div className="flex items-center gap-2">
          {getStatusBadge(entry.status, entry.refunded)}
          {entry.doctorPaid && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
              Paid Out
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "price",
      header: "Appointment Price",
      sortable: true,
      className: "text-right",
      accessor: (entry) => (
        <div className="text-right">
          <p className="font-semibold">{formatCurrency(entry.appointmentPrice)}</p>
          <p className="text-xs text-muted-foreground">
            Commission: {formatCurrency(entry.commissionAmount)}
          </p>
          {entry.refunded && entry.refundAmount && (
            <p className="text-xs text-red-600">
              Refunded: {formatCurrency(entry.refundAmount)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "payout",
      header: "Your Payout",
      sortable: true,
      className: "text-right",
      accessor: (entry) => (
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(entry.doctorPayoutAmount)}
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      accessor: () => (
        <Link href="/doctor/appointments">
          <Button variant="outline" size="sm">
            View
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      data={entries}
      columns={columns}
      searchable={true}
      searchPlaceholder="Search by patient name, date, or amount..."
      searchKeys={["patientName", "appointmentDate", "appointmentPrice"]}
      emptyMessage="No billing entries found"
      emptyIcon={<FileText className="h-8 w-8 text-muted-foreground" />}
    />
  );
}

export default DoctorBillingClient;

