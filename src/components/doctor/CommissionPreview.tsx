"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Percent, TrendingUp } from "lucide-react";
import type { CommissionPreviewProps } from "@/lib/types";
import { useCommissionPercentage } from "@/hooks";

export function CommissionPreview({ appointmentPrice, className }: CommissionPreviewProps) {
  const { data: commissionPercentage = 3.0 } = useCommissionPercentage();
  const [calculation, setCalculation] = useState<{
    commissionAmount: number;
    doctorPayoutAmount: number;
    commissionPercentageUsed: number;
  } | null>(null);

  useEffect(() => {
    if (appointmentPrice !== null && appointmentPrice > 0) {
      // Calculate commission on client side
      const validPercentage = Math.max(1.0, Math.min(10.0, commissionPercentage));
      const commissionAmount = (appointmentPrice * validPercentage) / 100;
      const doctorPayoutAmount = appointmentPrice - commissionAmount;
      
      setCalculation({
        commissionAmount: Number(commissionAmount.toFixed(2)),
        doctorPayoutAmount: Number(doctorPayoutAmount.toFixed(2)),
        commissionPercentageUsed: validPercentage,
      });
    } else {
      setCalculation(null);
    }
  }, [appointmentPrice, commissionPercentage]);

  if (!appointmentPrice || appointmentPrice <= 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Enter a price to see commission breakdown
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!calculation) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Commission Breakdown</h4>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Patient Pays</p>
              <p className="text-lg font-bold">${appointmentPrice.toFixed(2)}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Platform Fee</p>
              <p className="text-lg font-bold text-orange-600">
                ${calculation.commissionAmount.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                ({calculation.commissionPercentageUsed}%)
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Your Revenue</p>
              <p className="text-lg font-bold text-green-600">
                ${calculation.doctorPayoutAmount.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>
                You'll receive ${calculation.doctorPayoutAmount.toFixed(2)} per booking
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

