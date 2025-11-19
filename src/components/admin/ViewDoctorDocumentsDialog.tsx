"use client";

import { useDoctorVerification } from "@/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-skeleton";

interface ViewDoctorDocumentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: string;
  doctorName: string;
}

export default function ViewDoctorDocumentsDialog({
  isOpen,
  onClose,
  doctorId,
  doctorName,
}: ViewDoctorDocumentsDialogProps) {
  const { data: verification, isLoading, error } = useDoctorVerification(isOpen && doctorId ? doctorId : null);

  const getStatusBadge = () => {
    if (!verification) {
      return <Badge variant="secondary">No Documents Submitted</Badge>;
    }

    switch (verification.status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            APPROVED
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            REJECTED
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            PENDING
          </Badge>
        );
      default:
        return <Badge variant="secondary">{verification.status}</Badge>;
    }
  };

  const parseOtherDocuments = (): string[] => {
    if (!verification?.otherDocuments) return [];
    try {
      const parsed = JSON.parse(verification.otherDocuments);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const otherDocs = parseOtherDocuments();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verification Documents - {doctorName}</DialogTitle>
          <DialogDescription>
            View and access all verification documents submitted by this doctor
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <LoadingSpinner size="md" className="mx-auto" />
              <p className="text-sm text-muted-foreground">Loading documents...</p>
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load verification documents. Please try again.
            </AlertDescription>
          </Alert>
        ) : !verification ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">No verification documents submitted</p>
            <p className="text-sm text-muted-foreground">
              This doctor has not yet submitted any verification documents.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status and Metadata */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm font-medium mb-1">Verification Status</p>
                {getStatusBadge()}
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {verification.submittedAt && (
                  <p>
                    Submitted: {new Date(verification.submittedAt).toLocaleDateString()}
                  </p>
                )}
                {verification.reviewedAt && (
                  <p>
                    Reviewed: {new Date(verification.reviewedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Rejection Reason */}
            {verification.rejectionReason && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">Rejection Reason:</p>
                  <p>{verification.rejectionReason}</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Documents Grid */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Documents</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Medical License */}
                {verification.licenseUrl ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Medical License</p>
                        <p className="text-xs text-muted-foreground">Required document</p>
                      </div>
                    </div>
                    <a
                      href={verification.licenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 border border-dashed rounded-lg text-muted-foreground">
                    <FileText className="w-5 h-5" />
                    <div>
                      <p className="font-medium text-sm">Medical License</p>
                      <p className="text-xs">Not provided</p>
                    </div>
                  </div>
                )}

                {/* Certificate */}
                {verification.certificateUrl ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Professional Certificate</p>
                        <p className="text-xs text-muted-foreground">Optional document</p>
                      </div>
                    </div>
                    <a
                      href={verification.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 border border-dashed rounded-lg text-muted-foreground">
                    <FileText className="w-5 h-5" />
                    <div>
                      <p className="font-medium text-sm">Professional Certificate</p>
                      <p className="text-xs">Not provided</p>
                    </div>
                  </div>
                )}

                {/* ID Document */}
                {verification.idDocumentUrl ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">ID Document</p>
                        <p className="text-xs text-muted-foreground">Identity verification</p>
                      </div>
                    </div>
                    <a
                      href={verification.idDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 border border-dashed rounded-lg text-muted-foreground">
                    <FileText className="w-5 h-5" />
                    <div>
                      <p className="font-medium text-sm">ID Document</p>
                      <p className="text-xs">Not provided</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Other Documents */}
              {otherDocs.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-3">Additional Documents</h4>
                  <div className="space-y-2">
                    {otherDocs.map((docUrl, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Document {index + 1}</span>
                        </div>
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {verification.status === "PENDING" && (
                <Button
                  onClick={() => {
                    window.location.href = `/admin/verifications`;
                  }}
                >
                  Review in Verifications Page
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

