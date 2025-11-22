"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { PaymentAccountStatusProps } from "@/lib/types";
import { useDoctorPaymentAccountStatus } from "@/hooks";

export function PaymentAccountStatus({ doctorId }: PaymentAccountStatusProps) {
  const router = useRouter();
  const { data: accountStatus, isLoading } = useDoctorPaymentAccountStatus(doctorId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 animate-spin" />
            Loading payment account status...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!accountStatus?.exists) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Payment Account Not Set Up</p>
                <p className="text-sm text-muted-foreground">
                  Set up your account to receive payouts
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/doctor/settings/payments")}
            >
              Set Up
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isActive = accountStatus.accountStatus === "ACTIVE";
  const isPending = accountStatus.accountStatus === "PENDING";

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isActive ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : isPending ? (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <p className="font-medium">Payment Account</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={
                    isActive ? "default" : isPending ? "secondary" : "destructive"
                  }
                >
                  {accountStatus.accountStatus}
                </Badge>
                {accountStatus.payoutEnabled && (
                  <Badge variant="outline">Payouts Enabled</Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/doctor/settings/payments")}
          >
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

