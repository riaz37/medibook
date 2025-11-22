"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DollarSign } from "lucide-react";
import type { PaymentHistoryProps } from "@/lib/types";
import { useDoctorPayments } from "@/hooks";
import { LoadingSpinner } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export function PaymentHistory({ doctorId }: PaymentHistoryProps) {
  const { data: payments, isLoading } = useDoctorPayments(doctorId);
  const paymentsArray = Array.isArray(payments) ? payments : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your appointment payments and payouts</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!paymentsArray || paymentsArray.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your appointment payments and payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={DollarSign}
            title="No payments yet"
            description="Your payment history will appear here once you receive payments from appointments."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Payment History
        </CardTitle>
        <CardDescription>Your appointment payments and payouts</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Appointment</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Payout</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentsArray.map((payment: any) => (
              <TableRow key={payment.id}>
                <TableCell>
                  {format(new Date(payment.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="font-medium">
                  {payment.appointment?.appointmentType?.name || "Appointment"}
                </TableCell>
                <TableCell>
                  ${Number(payment.appointmentPrice).toFixed(2)}
                </TableCell>
                <TableCell className="text-orange-600">
                  -${Number(payment.commissionAmount).toFixed(2)}
                </TableCell>
                <TableCell className="text-green-600 font-medium">
                  ${Number(payment.doctorPayoutAmount).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      payment.doctorPaid
                        ? "default"
                        : payment.patientPaid
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {payment.doctorPaid
                      ? "Paid"
                      : payment.patientPaid
                      ? "Pending"
                      : "Processing"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

