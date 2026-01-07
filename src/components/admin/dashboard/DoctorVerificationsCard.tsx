"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useAdminDoctorVerifications } from "@/hooks";
import { VerificationListSkeleton, VerificationStatusBadge } from "@/components/shared";

export default function DoctorVerificationsCard() {
  const { data: verifications = [], isLoading } = useAdminDoctorVerifications("PENDING");

  const pendingCount = verifications.length;
  const recentVerifications = verifications.slice(0, 3);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-primary" />
              Doctor Verifications
            </CardTitle>
            <CardDescription>Review and approve doctor documents</CardDescription>
          </div>
          <Link href="/admin/verifications">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <VerificationListSkeleton count={3} />
        ) : pendingCount === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="size-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">No pending verifications</p>
            <p className="text-xs text-muted-foreground">
              All doctor verifications are up to date
            </p>
          </div>
        ) : (
          <>
            <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl border border-orange-500/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-orange-600 mb-1">Pending Verifications</p>
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                    {pendingCount} {pendingCount === 1 ? "request" : "requests"}
                  </Badge>
                </div>
                <Clock className="size-5 text-orange-600" />
              </div>
            </div>

            <div className="space-y-3">
              {recentVerifications.map((verification) => (
                <div
                  key={verification.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{verification.doctor.name}</p>
                    <p className="text-xs text-muted-foreground">{verification.doctor.speciality}</p>
                    {verification.submittedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(verification.submittedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  <VerificationStatusBadge status="PENDING" />
                </div>
              ))}
            </div>

            {pendingCount > 3 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-center text-muted-foreground">
                  +{pendingCount - 3} more verification{pendingCount - 3 > 1 ? "s" : ""} pending
                </p>
              </div>
            )}

            <Link href="/admin/verifications" className="block">
              <Button className="w-full" size="sm">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Review All Verifications
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}

