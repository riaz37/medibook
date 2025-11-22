"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, CheckCircle2, XCircle, Clock, FileText, Eye, User, Save, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import ViewMyDocumentsDialog from "@/components/doctor/ViewMyDocumentsDialog";
import { Gender } from "@prisma/client";
import { FileUpload } from "@/components/ui/file-upload";
import { doctorsService } from "@/lib/services";
import { useSubmitDoctorVerification, useUpdateDoctor } from "@/hooks";
import type { DoctorSettingsClientProps, DoctorSettingsData, DoctorVerificationData } from "@/lib/types";

const SPECIALITIES = [
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Oncology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Rheumatology",
  "Urology",
  "Other",
];

export default function DoctorSettingsClient({ doctor, verification }: DoctorSettingsClientProps) {
  // Type assertions for compatibility
  const doctorData = doctor as DoctorSettingsData;
  const verificationData = verification as DoctorVerificationData | null;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmittingDocs, setIsSubmittingDocs] = useState(false);
  const [isViewDocumentsDialogOpen, setIsViewDocumentsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Check if we should open a specific tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "documents" || tab === "profile") {
      setActiveTab(tab);
    }
  }, [searchParams]);
  
  const [formData, setFormData] = useState({
    name: doctorData.name,
    phone: doctorData.phone,
    speciality: doctorData.speciality,
    bio: doctorData.bio || "",
    gender: doctorData.gender,
  });

  const [documents, setDocuments] = useState({
    licenseUrl: verificationData?.licenseUrl || "",
    certificateUrl: verificationData?.certificateUrl || "",
    idDocumentUrl: verificationData?.idDocumentUrl || "",
  });

  const profileComplete = formData.name && formData.phone && formData.speciality && formData.gender;
  const documentsSubmitted = verificationData?.status === "PENDING" || verificationData?.status === "APPROVED";
  const canUpdateDocuments = verificationData?.status === "REJECTED" || verificationData?.status === "PENDING" || !verificationData;
  const [isEditingDocuments, setIsEditingDocuments] = useState(false);

  const updateDoctorMutation = useUpdateDoctor();
  const submitVerificationMutation = useSubmitDoctorVerification();

  const handleProfileUpdate = async () => {
    if (!profileComplete) {
      toast.error("Please fill in all required fields");
      return;
    }

    updateDoctorMutation.mutate(
      {
        id: doctor.id,
        ...formData,
      },
      {
        onSuccess: () => {
          toast.success("Profile updated successfully");
          router.refresh();
        },
        onError: (error) => {
          console.error("Error updating profile:", error);
          toast.error(error instanceof Error ? error.message : "Failed to update profile");
        },
      }
    );
  };

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
          router.refresh();
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

  const getVerificationStatus = () => {
    if (!verification) return null;
    
    switch (verification.status) {
      case "APPROVED":
        return {
          icon: CheckCircle2,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-950/20",
          message: "Your account has been verified!",
        };
      case "REJECTED":
        return {
          icon: XCircle,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-950/20",
          message: `Verification rejected: ${verification.rejectionReason || "Please review your documents"}`,
        };
      case "PENDING":
        return {
          icon: Clock,
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
          message: "Your documents are under review. We'll notify you once approved.",
        };
      default:
        return null;
    }
  };

  const statusInfo = getVerificationStatus();

  return (
    <>
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile information and verification documents
          </p>
        </div>

        {/* Verification Status */}
        {statusInfo && (
          <Alert className={statusInfo.bgColor}>
            <statusInfo.icon className={`h-4 w-4 ${statusInfo.color}`} />
            <AlertDescription className={statusInfo.color}>
              {statusInfo.message}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Verification Documents
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your basic profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="speciality">Speciality *</Label>
                    <Select
                      value={formData.speciality}
                      onValueChange={(value) => setFormData({ ...formData, speciality: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select speciality" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIALITIES.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value as Gender })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell patients about your experience and expertise..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleProfileUpdate} disabled={!profileComplete || updateDoctorMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {updateDoctorMutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Verification Documents</CardTitle>
                <CardDescription>
                  Manage your verification documents. Update and resubmit if needed.
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
                    {/* Manual URL input as fallback */}
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
                    {/* Manual URL input as fallback */}
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
                    {/* Manual URL input as fallback */}
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
                              // Reset to original values
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Documents Dialog */}
      <ViewMyDocumentsDialog
        isOpen={isViewDocumentsDialogOpen}
        onClose={() => setIsViewDocumentsDialogOpen(false)}
        doctorId={doctor.id}
      />
    </>
  );
}

