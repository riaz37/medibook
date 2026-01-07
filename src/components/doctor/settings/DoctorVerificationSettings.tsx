"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Save, X, ExternalLink, Upload, Eye } from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/file-upload";
import { useSubmitDoctorVerification } from "@/hooks";
import ViewMyDocumentsDialog from "@/components/doctor/ViewMyDocumentsDialog";

interface DoctorVerificationSettingsProps {
    doctor: {
        id: string;
    };
    verification: {
        status: string;
        licenseUrl?: string;
        certificateUrl?: string;
        idDocumentUrl?: string;
        submittedAt?: Date | string;
        rejectionReason?: string;
    } | null;
    onUpdate?: () => void;
}

export function DoctorVerificationSettings({
    doctor,
    verification,
    onUpdate,
}: DoctorVerificationSettingsProps) {
    const [isSubmittingDocs, setIsSubmittingDocs] = useState(false);
    const [isViewDocumentsDialogOpen, setIsViewDocumentsDialogOpen] = useState(false);
    const [isEditingDocuments, setIsEditingDocuments] = useState(false);

    const [documents, setDocuments] = useState({
        licenseUrl: verification?.licenseUrl || "",
        certificateUrl: verification?.certificateUrl || "",
        idDocumentUrl: verification?.idDocumentUrl || "",
    });

    const submitVerificationMutation = useSubmitDoctorVerification();

    const documentsSubmitted = verification?.status === "PENDING" || verification?.status === "APPROVED";
    const canUpdateDocuments = verification?.status === "REJECTED" || verification?.status === "PENDING" || !verification;

    const handleRemoveDocument = (field: "licenseUrl" | "certificateUrl" | "idDocumentUrl") => {
        setDocuments((prev) => ({
            ...prev,
            [field]: "",
        }));
        toast.success("Document removed");
    };

    const handleDocumentSubmit = async () => {
        if (!documents.licenseUrl) {
            toast.error("Medical license is required");
            return;
        }

        setIsSubmittingDocs(true);
        submitVerificationMutation.mutate(
            { doctorId: doctor.id, data: documents },
            {
                onSuccess: () => {
                    toast.success("Documents submitted for review");
                    setIsEditingDocuments(false);
                    onUpdate?.();
                },
                onError: (error) => {
                    console.error("Error submitting documents:", error);
                    toast.error(error instanceof Error ? error.message : "Failed to submit documents");
                },
                onSettled: () => {
                    setIsSubmittingDocs(false);
                },
            }
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Verification Documents</CardTitle>
                <CardDescription>
                    {verification?.status === "REJECTED"
                        ? "Your documents were rejected. Please update and resubmit."
                        : "Your verification documents were submitted during application. You can update them if needed."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className={`space-y-6 ${documentsSubmitted && !isEditingDocuments ? "opacity-50 pointer-events-none" : ""}`}>
                    {/* Medical License */}
                    <div className="space-y-2">
                        <Label htmlFor="license">Medical License *</Label>
                        {documents.licenseUrl ? (
                            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">Medical License</p>
                                    <p className="text-xs text-muted-foreground truncate">{documents.licenseUrl}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={documents.licenseUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        <Button variant="ghost" size="sm">
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </a>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveDocument("licenseUrl")}
                                        disabled={documentsSubmitted && !isEditingDocuments}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <FileUpload
                                onUploadComplete={(url) => {
                                    setDocuments((prev) => ({ ...prev, licenseUrl: url }));
                                }}
                                onUploadError={(error) => {
                                    toast.error(error.message || "Failed to upload file");
                                }}
                                folder="doctor-verifications"
                                maxSize={10 * 1024 * 1024}
                                accept="image/*,.pdf,.doc,.docx"
                                label="Upload Medical License"
                                disabled={documentsSubmitted && !isEditingDocuments}
                            />
                        )}
                        <Input
                            id="license"
                            value={documents.licenseUrl}
                            onChange={(e) => setDocuments({ ...documents, licenseUrl: e.target.value })}
                            placeholder="Or enter document URL manually"
                            disabled={documentsSubmitted && !isEditingDocuments || !!documents.licenseUrl}
                            className="text-sm"
                        />
                    </div>

                    {/* Professional Certificate */}
                    <div className="space-y-2">
                        <Label htmlFor="certificate">Professional Certificate (Optional)</Label>
                        {documents.certificateUrl ? (
                            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">Professional Certificate</p>
                                    <p className="text-xs text-muted-foreground truncate">{documents.certificateUrl}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={documents.certificateUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        <Button variant="ghost" size="sm">
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </a>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveDocument("certificateUrl")}
                                        disabled={documentsSubmitted && !isEditingDocuments}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <FileUpload
                                onUploadComplete={(url) => {
                                    setDocuments((prev) => ({ ...prev, certificateUrl: url }));
                                }}
                                onUploadError={(error) => {
                                    toast.error(error.message || "Failed to upload file");
                                }}
                                folder="doctor-verifications"
                                maxSize={10 * 1024 * 1024}
                                accept="image/*,.pdf,.doc,.docx"
                                label="Upload Certificate"
                                disabled={documentsSubmitted && !isEditingDocuments}
                            />
                        )}
                        <Input
                            id="certificate"
                            value={documents.certificateUrl}
                            onChange={(e) => setDocuments({ ...documents, certificateUrl: e.target.value })}
                            placeholder="Or enter document URL manually"
                            disabled={documentsSubmitted && !isEditingDocuments || !!documents.certificateUrl}
                            className="text-sm"
                        />
                    </div>

                    {/* ID Document */}
                    <div className="space-y-2">
                        <Label htmlFor="idDocument">ID Document (Optional)</Label>
                        {documents.idDocumentUrl ? (
                            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">ID Document</p>
                                    <p className="text-xs text-muted-foreground truncate">{documents.idDocumentUrl}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={documents.idDocumentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        <Button variant="ghost" size="sm">
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </a>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveDocument("idDocumentUrl")}
                                        disabled={documentsSubmitted && !isEditingDocuments}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <FileUpload
                                onUploadComplete={(url) => {
                                    setDocuments((prev) => ({ ...prev, idDocumentUrl: url }));
                                }}
                                onUploadError={(error) => {
                                    toast.error(error.message || "Failed to upload file");
                                }}
                                folder="doctor-verifications"
                                maxSize={10 * 1024 * 1024}
                                accept="image/*,.pdf,.doc,.docx"
                                label="Upload ID Document"
                                disabled={documentsSubmitted && !isEditingDocuments}
                            />
                        )}
                        <Input
                            id="idDocument"
                            value={documents.idDocumentUrl}
                            onChange={(e) => setDocuments({ ...documents, idDocumentUrl: e.target.value })}
                            placeholder="Or enter document URL manually"
                            disabled={documentsSubmitted && !isEditingDocuments || !!documents.idDocumentUrl}
                            className="text-sm"
                        />
                    </div>
                </div>

                {/* Document Actions */}
                <div className="space-y-3">
                    {documentsSubmitted && !isEditingDocuments && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileText className="w-4 h-4" />
                                <span>Documents submitted on {verification?.submittedAt ? new Date(verification.submittedAt).toLocaleDateString() : "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsViewDocumentsDialogOpen(true)}
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Documents
                                </Button>
                                {canUpdateDocuments && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditingDocuments(true)}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Update Documents
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {(isEditingDocuments || !documentsSubmitted) && (
                        <div className="space-y-3">
                            {isEditingDocuments && (
                                <Alert>
                                    <AlertDescription>
                                        Update your documents below. Changes will be resubmitted for review.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleDocumentSubmit}
                                    disabled={!documents.licenseUrl || isSubmittingDocs}
                                >
                                    {isSubmittingDocs ? "Submitting..." : isEditingDocuments ? "Resubmit Documents" : "Submit for Verification"}
                                </Button>
                                {isEditingDocuments && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditingDocuments(false);
                                            setDocuments({
                                                licenseUrl: verification?.licenseUrl || "",
                                                certificateUrl: verification?.certificateUrl || "",
                                                idDocumentUrl: verification?.idDocumentUrl || "",
                                            });
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* View Documents Dialog */}
                <ViewMyDocumentsDialog
                    isOpen={isViewDocumentsDialogOpen}
                    onClose={() => setIsViewDocumentsDialogOpen(false)}
                    doctorId={doctor.id}
                />
            </CardContent>
        </Card>
    );
}
