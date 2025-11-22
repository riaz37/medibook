"use client";

import { useAdminRevenue } from "@/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DollarSign, TrendingUp } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-skeleton";
import { showErrorToast } from "@/components/shared/ErrorToast";
import { handleApiError } from "@/lib/utils/toast";
import { useEffect } from "react";
import { StatCard } from "@/components/ui/stat-card";
import type { AdminRevenueData } from "@/lib/types";

export function PlatformRevenue() {
  const { data: revenueResponse, isLoading, isError, error } = useAdminRevenue();
  const revenue = revenueResponse as AdminRevenueData | undefined;

  useEffect(() => {
    if (isError && error) {
      const errorMessage = handleApiError(error, "Failed to load revenue data");
      showErrorToast({ message: errorMessage, retry: () => window.location.reload() });
    }
  }, [isError, error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Revenue"
          value={`$${revenue?.totalRevenue?.toFixed(2) || "0.00"}`}
          description="All time"
          icon={DollarSign}
        />
        <StatCard
          title="This Month"
          value={`$${revenue?.monthlyRevenue?.toFixed(2) || "0.00"}`}
          description="Current month"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Appointments"
          value={revenue?.totalAppointments || 0}
          description="With payments"
          icon={DollarSign}
        />
      </div>

      {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Platform commission from appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {!revenue?.recentPayments || revenue.recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No payments yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Appointment</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenue.recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {format(new Date(payment.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{payment.doctor?.name || "N/A"}</TableCell>
                      <TableCell>
                        {payment.appointment?.appointmentType?.name || "Appointment"}
                      </TableCell>
                      <TableCell>
                        ${Number(payment.appointmentPrice).toFixed(2)}
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        ${Number(payment.commissionAmount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === "COMPLETED"
                              ? "default"
                              : payment.status === "PENDING"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

