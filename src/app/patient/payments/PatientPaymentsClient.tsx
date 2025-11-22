"use client";

import { useState } from "react";
import { usePatientPayments } from "@/hooks";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Download, Calendar, Clock, DollarSign, FileText } from "lucide-react";
import { format } from "date-fns";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-skeleton";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from "@/lib/utils/export";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Payment } from "@/lib/types";

function PatientPaymentsClient() {
  const { data: paymentsData, isLoading } = usePatientPayments();
  const payments = (paymentsData as Payment[]) || [];

  const getStatusBadge = (payment: Payment) => {
    if (payment.refunded) {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
          Refunded
        </Badge>
      );
    }
    if (payment.status === "COMPLETED") {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
          Paid
        </Badge>
      );
    }
    if (payment.status === "PENDING") {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          Pending
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground">
        {payment.status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const paidPayments = payments.filter((p: Payment) => p.patientPaid && !p.refunded);
  const pendingPayments = payments.filter((p: Payment) => !p.patientPaid && p.status === "PENDING");
  const refundedPayments = payments.filter((p: Payment) => p.refunded);

  const totalPaid = paidPayments.reduce((sum: number, p: Payment) => sum + Number(p.appointmentPrice), 0);
  const totalRefunded = refundedPayments.reduce(
    (sum: number, p: Payment) => sum + Number(p.refundAmount || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleExport = () => {
    exportToCSV(
      payments,
      [
        { key: "doctor", label: "Doctor", accessor: (p) => p.appointment?.doctor.name || "N/A" },
        { key: "date", label: "Date", accessor: (p) => p.appointment ? formatDateForExport(p.appointment.date) : "N/A" },
        { key: "time", label: "Time", accessor: (p) => p.appointment?.time || "N/A" },
        { key: "amount", label: "Amount", accessor: (p) => formatCurrencyForExport(Number(p.appointmentPrice)) },
        { key: "status", label: "Status", accessor: (p) => p.refunded ? "Refunded" : p.status },
        { key: "paidDate", label: "Paid Date", accessor: (p) => p.patientPaidAt ? formatDateForExport(p.patientPaidAt) : "N/A" },
      ],
      "patient-payments"
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment History"
        description="View all your payment transactions and receipts"
        actions={
          payments.length > 0 ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download payment history as CSV</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">{paidPayments.length} payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refunded</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRefunded)}</div>
            <p className="text-xs text-muted-foreground">{refundedPayments.length} refunds</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
          <CardDescription>Your complete payment history</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments yet"
              description="Your payment history will appear here once you make payments for appointments."
              action={{
                label: "Book an Appointment",
                href: "/patient/appointments/book",
              }}
            />
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All ({payments.length})</TabsTrigger>
                <TabsTrigger value="paid">Paid ({paidPayments.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({pendingPayments.length})</TabsTrigger>
                {refundedPayments.length > 0 && (
                  <TabsTrigger value="refunded">Refunded ({refundedPayments.length})</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <PaymentsTable
                  data={payments}
                  emptyMessage="No payments found"
                  emptyIcon={<CreditCard className="h-8 w-8 text-muted-foreground" />}
                />
              </TabsContent>
              <TabsContent value="paid" className="mt-4">
                <PaymentsTable
                  data={paidPayments}
                  emptyMessage="No paid payments found"
                  emptyIcon={<CreditCard className="h-8 w-8 text-muted-foreground" />}
                />
              </TabsContent>
              <TabsContent value="pending" className="mt-4">
                <PaymentsTable
                  data={pendingPayments}
                  emptyMessage="No pending payments found"
                  emptyIcon={<CreditCard className="h-8 w-8 text-muted-foreground" />}
                />
              </TabsContent>
              {refundedPayments.length > 0 && (
                <TabsContent value="refunded" className="mt-4">
                  <PaymentsTable
                    data={refundedPayments}
                    emptyMessage="No refunded payments found"
                    emptyIcon={<CreditCard className="h-8 w-8 text-muted-foreground" />}
                  />
                </TabsContent>
              )}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentsTable({ data, emptyMessage, emptyIcon }: { data: Payment[]; emptyMessage: string; emptyIcon: React.ReactNode }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadge = (payment: Payment) => {
    if (payment.refunded) {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
          Refunded
        </Badge>
      );
    }
    if (payment.status === "COMPLETED") {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
          Paid
        </Badge>
      );
    }
    if (payment.status === "PENDING") {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          Pending
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground">
        {payment.status}
      </Badge>
    );
  };

  const columns: Column<Payment>[] = [
    {
      key: "doctor",
      header: "Doctor",
      sortable: true,
      accessor: (payment) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <CreditCard className="size-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{payment.appointment?.doctor.name || "N/A"}</p>
            <p className="text-xs text-muted-foreground">
              {payment.appointment?.appointmentType?.name || payment.appointment?.reason || "Appointment"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date & Time",
      sortable: true,
      accessor: (payment) =>
        payment.appointment ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="size-3 text-muted-foreground" />
              {format(new Date(payment.appointment.date), "MMM d, yyyy")}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {payment.appointment.time}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (payment) => getStatusBadge(payment),
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      className: "text-right",
      accessor: (payment) => (
        <div className="text-right">
          {payment.refunded ? (
            <>
              <p className="text-sm font-semibold text-red-600">
                -{formatCurrency(Number(payment.refundAmount || 0))}
              </p>
              <p className="text-xs text-muted-foreground line-through">
                {formatCurrency(Number(payment.appointmentPrice))}
              </p>
            </>
          ) : (
            <p className="font-semibold">{formatCurrency(Number(payment.appointmentPrice))}</p>
          )}
        </div>
      ),
    },
    {
      key: "paidDate",
      header: "Paid Date",
      sortable: true,
      accessor: (payment) =>
        payment.patientPaidAt ? (
          <span className="text-sm">{format(new Date(payment.patientPaidAt), "MMM d, yyyy")}</span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (payment) =>
        payment.appointment ? (
          <Link href={`/patient/appointments/${payment.appointment.id}`}>
            <Button variant="outline" size="sm">
              View
            </Button>
          </Link>
        ) : null,
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchable={true}
      searchPlaceholder="Search by doctor name, date, or amount..."
      searchKeys={["appointment.doctor.name", "appointment.date", "appointmentPrice"]}
      emptyMessage={emptyMessage}
      emptyIcon={emptyIcon}
    />
  );
}

export default PatientPaymentsClient;

