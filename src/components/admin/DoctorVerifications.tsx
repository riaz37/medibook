"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAdminDoctorVerifications, useUpdateVerificationStatus } from "@/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { VerificationWithDoctor } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { VerificationCard } from "./VerificationCard";
import { VerificationActionsDialog } from "./VerificationActionsDialog";
import { VerificationListSkeleton } from "@/components/shared";

export default function DoctorVerifications() {
  const [selectedVerification, setSelectedVerification] = useState<VerificationWithDoctor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const { data: verifications = [], isLoading } = useAdminDoctorVerifications("PENDING");
  const updateVerificationMutation = useUpdateVerificationStatus();

  const approveMutation = useMutation({
    mutationFn: async (verificationId: string) => {
      return updateVerificationMutation.mutateAsync({
        verificationId,
        data: { status: "APPROVED" },
      });
    },
    onSuccess: () => {
      toast.success("Doctor verified successfully");
      setIsDialogOpen(false);
      setSelectedVerification(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ verificationId, reason }: { verificationId: string; reason: string }) => {
      return updateVerificationMutation.mutateAsync({
        verificationId,
        data: { status: "REJECTED", rejectionReason: reason },
      });
    },
    onSuccess: () => {
      toast.success("Verification rejected");
      setIsDialogOpen(false);
      setSelectedVerification(null);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleApprove = (verification: VerificationWithDoctor) => {
    setSelectedVerification(verification);
    setAction("approve");
    setIsDialogOpen(true);
  };

  const handleReject = (verification: VerificationWithDoctor) => {
    setSelectedVerification(verification);
    setAction("reject");
    setIsDialogOpen(true);
  };

  const confirmAction = () => {
    if (!selectedVerification) return;

    if (action === "approve") {
      approveMutation.mutate(selectedVerification.id);
    } else if (action === "reject") {
      if (!rejectionReason.trim()) {
        toast.error("Please provide a rejection reason");
        return;
      }
      rejectMutation.mutate({
        verificationId: selectedVerification.id,
        reason: rejectionReason,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Doctor Verifications</CardTitle>
          <CardDescription>Review and approve doctor documents</CardDescription>
        </CardHeader>
        <CardContent>
          <VerificationListSkeleton count={3} />
        </CardContent>
      </Card>
    );
  }

  if (verifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Doctor Verifications</CardTitle>
          <CardDescription>Review and approve doctor documents</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={CheckCircle2}
            title="No pending verifications"
            description="All doctor verifications have been reviewed. New submissions will appear here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Doctor Verifications</CardTitle>
          <CardDescription>
            {verifications.length} pending verification{verifications.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {verifications.map((verification) => (
              <VerificationCard
                key={verification.id}
                verification={verification}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <VerificationActionsDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        action={action}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        onConfirm={confirmAction}
        isLoading={approveMutation.isPending || rejectMutation.isPending}
      />
    </>
  );
}


