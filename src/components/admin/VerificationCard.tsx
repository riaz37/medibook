"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import type { VerificationWithDoctor } from "@/lib/types";
import { VerificationStatusBadge, DocumentLink, UserAvatar } from "@/components/shared";

interface VerificationCardProps {
    verification: VerificationWithDoctor;
    onApprove: (verification: VerificationWithDoctor) => void;
    onReject: (verification: VerificationWithDoctor) => void;
}

export function VerificationCard({ verification, onApprove, onReject }: VerificationCardProps) {
    return (
        <div className="border rounded-lg p-4 space-y-4">
            {/* Doctor Info */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <UserAvatar
                        src={verification.doctor.imageUrl}
                        name={verification.doctor.name}
                        size="xl"
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
                <VerificationStatusBadge status="PENDING" showIcon />
            </div>

            {/* Documents */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {verification.licenseUrl && (
                    <DocumentLink label="Medical License" url={verification.licenseUrl} />
                )}
                {verification.certificateUrl && (
                    <DocumentLink label="Certificate" url={verification.certificateUrl} />
                )}
                {verification.idDocumentUrl && (
                    <DocumentLink label="ID Document" url={verification.idDocumentUrl} />
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button
                    onClick={() => onApprove(verification)}
                    className="flex-1"
                    variant="default"
                >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                </Button>
                <Button
                    onClick={() => onReject(verification)}
                    className="flex-1"
                    variant="destructive"
                >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                </Button>
            </div>
        </div>
    );
}

