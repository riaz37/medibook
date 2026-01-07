"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface VerificationActionsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    action: "approve" | "reject" | null;
    rejectionReason: string;
    onRejectionReasonChange: (reason: string) => void;
    onConfirm: () => void;
    isLoading: boolean;
}

export function VerificationActionsDialog({
    isOpen,
    onOpenChange,
    action,
    rejectionReason,
    onRejectionReasonChange,
    onConfirm,
    isLoading,
}: VerificationActionsDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                            onChange={(e) => onRejectionReasonChange(e.target.value)}
                            placeholder="Explain why the verification is being rejected..."
                            rows={4}
                        />
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        variant={action === "approve" ? "default" : "destructive"}
                        disabled={(action === "reject" && !rejectionReason.trim()) || isLoading}
                    >
                        {isLoading ? "Processing..." : action === "approve" ? "Approve" : "Reject"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
