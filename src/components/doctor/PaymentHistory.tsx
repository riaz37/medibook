"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DollarSign, Loader2 } from "lucide-react";

interface PaymentHistoryProps {
  doctorId: string;
}

export function PaymentHistory({ doctorId }: PaymentHistoryProps) {
  const { data: payments, isLoading } = useQuery({
    queryKey: ["doctor-payments", doctorId],
    queryFn: async () => {
      const response = await fetch(`/api/doctors/${doctorId}/payments`);
      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your appointment payments and payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No payments yet
          </p>
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
            {payments.map((payment: any) => (
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

