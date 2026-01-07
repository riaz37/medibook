"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { useAdminDoctorVerifications, useAdminDoctorApplications } from "@/hooks";
import { VerificationListSkeleton } from "@/components/shared";
import { EmptyState } from "@/components/ui/empty-state";
import { useMemo } from "react";

export default function PendingVerifications() {
  const { data: verifications = [], isLoading: isLoadingVerifications } = useAdminDoctorVerifications("PENDING");
  const { data: applications = [], isLoading: isLoadingApplications } = useAdminDoctorApplications();

  const isLoading = isLoadingVerifications || isLoadingApplications;

  const pendingCount = useMemo(() => {
    const pendingVerifications = verifications.filter((v) => v.status === "PENDING").length;
    const pendingApplications = applications.filter((a) => a.status === "PENDING").length;
    return pendingVerifications + pendingApplications;
  }, [verifications, applications]);

  const recentPending = useMemo(() => {
    const pendingVerifications = verifications
      .filter((v) => v.status === "PENDING")
      .slice(0, 3)
      .map((v) => ({
        id: v.id,
        type: "verification" as const,
        name: v.doctor.name,
        email: v.doctor.email,
        speciality: v.doctor.speciality,
        submittedAt: v.submittedAt || v.doctor.createdAt,
      }));

    const pendingApplications = applications
      .filter((a) => a.status === "PENDING")
      .slice(0, 3)
      .map((a) => ({
        id: a.id,
        type: "application" as const,
        name: `${a.user.firstName || ""} ${a.user.lastName || ""}`.trim() || a.user.email,
        email: a.user.email,
        speciality: a.speciality,
        submittedAt: a.submittedAt,
      }));

    return [...pendingVerifications, ...pendingApplications]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5);
  }, [verifications, applications]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Verifications</CardTitle>
          <CardDescription>Review and approve doctor applications and verifications</CardDescription>
        </CardHeader>
        <CardContent>
          <VerificationListSkeleton count={3} />
        </CardContent>
      </Card>
    );
  }

  if (pendingCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Verifications</CardTitle>
          <CardDescription>Review and approve doctor applications and verifications</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={CheckCircle2}
            title="No pending items"
            description="All applications and verifications have been reviewed. New submissions will appear here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-orange-600" />
              Pending Verifications
            </CardTitle>
            <CardDescription>
              {pendingCount} item{pendingCount !== 1 ? "s" : ""} awaiting review
            </CardDescription>
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
        {recentPending.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-3 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === "verification"
                  ? "bg-blue-500/10 text-blue-600"
                  : "bg-purple-500/10 text-purple-600"
                  }`}
              >
                {item.type === "verification" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {item.type === "verification" ? "Verification" : "Application"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{item.email}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.speciality}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
        {pendingCount > recentPending.length && (
          <div className="pt-2 border-t">
            <Link href="/admin/verifications">
              <Button variant="outline" className="w-full">
                View {pendingCount - recentPending.length} more item{pendingCount - recentPending.length !== 1 ? "s" : ""}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

