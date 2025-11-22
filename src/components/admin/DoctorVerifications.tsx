"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminDoctorVerifications, useUpdateVerificationStatus } from "@/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";
import type { VerificationWithDoctor } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function DoctorVerifications() {
  const queryClient = useQueryClient();
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
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="md" />
          </div>
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
              <div
                key={verification.id}
                className="border rounded-lg p-4 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <img
                      src={verification.doctor.imageUrl}
                      alt={verification.doctor.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{verification.doctor.name}</h3>
                      <p className="text-sm text-muted-foreground">{verification.doctor.email}</p>
                      <p className="text-sm text-muted-foreground">{verification.doctor.speciality}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted: {verification.submittedAt ? new Date(verification.submittedAt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    PENDING
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {verification.licenseUrl && (
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1">Medical License</span>
                      <a
                        href={verification.licenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                  {verification.certificateUrl && (
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1">Certificate</span>
                      <a
                        href={verification.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                  {verification.idDocumentUrl && (
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1">ID Document</span>
                      <a
                        href={verification.idDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(verification)}
                    className="flex-1"
                    variant="default"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(verification)}
                    className="flex-1"
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve Verification" : "Reject Verification"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "Are you sure you want to approve this doctor's verification? They will be able to accept appointments."
                : "Please provide a reason for rejecting this verification."}
            </DialogDescription>
          </DialogHeader>
          {action === "reject" && (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why the verification is being rejected..."
                rows={4}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              variant={action === "approve" ? "default" : "destructive"}
              disabled={
                (action === "reject" && !rejectionReason.trim()) ||
                approveMutation.isPending ||
                rejectMutation.isPending
              }
            >
              {approveMutation.isPending || rejectMutation.isPending
                ? "Processing..."
                : action === "approve"
                ? "Approve"
                : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

