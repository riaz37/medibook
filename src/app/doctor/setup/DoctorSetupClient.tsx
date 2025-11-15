"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Gender } from "@prisma/client";

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  speciality: string;
  bio: string | null;
  gender: Gender;
  isVerified: boolean;
}

interface Verification {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  licenseUrl: string | null;
  certificateUrl: string | null;
  idDocumentUrl: string | null;
  submittedAt: Date | null;
  rejectionReason: string | null;
}

interface DoctorSetupClientProps {
  doctor: Doctor;
  verification: Verification | null;
}

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

export default function DoctorSetupClient({ doctor, verification }: DoctorSetupClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingDocs, setIsSubmittingDocs] = useState(false);
  
  const [formData, setFormData] = useState({
    name: doctor.name,
    phone: doctor.phone,
    speciality: doctor.speciality,
    bio: doctor.bio || "",
    gender: doctor.gender,
  });

  const [documents, setDocuments] = useState({
    licenseUrl: verification?.licenseUrl || "",
    certificateUrl: verification?.certificateUrl || "",
    idDocumentUrl: verification?.idDocumentUrl || "",
  });

  const profileComplete = formData.name && formData.phone && formData.speciality && formData.gender;
  const documentsSubmitted = verification?.status === "PENDING" || verification?.status === "APPROVED";

  const handleProfileUpdate = async () => {
    if (!profileComplete) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/doctors/${doctor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = async (field: "licenseUrl" | "certificateUrl" | "idDocumentUrl") => {
    // TODO: Implement actual file upload (e.g., to cloud storage)
    // For now, this is a placeholder - you'll need to integrate with a file storage service
    toast.info("File upload functionality coming soon. Please provide document URLs manually.");
    
    // In production, you would:
    // 1. Upload file to cloud storage (AWS S3, Cloudinary, etc.)
    // 2. Get the URL
    // 3. Update documents state
  };

  const handleDocumentSubmit = async () => {
    if (!documents.licenseUrl) {
      toast.error("Medical license is required");
      return;
    }

    setIsSubmittingDocs(true);
    try {
      const response = await fetch(`/api/doctors/${doctor.id}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(documents),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit documents");
      }

      toast.success("Documents submitted for review");
      router.refresh();
    } catch (error) {
      console.error("Error submitting documents:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit documents");
    } finally {
      setIsSubmittingDocs(false);
    }
  };

  const getVerificationStatus = () => {
    if (!verification) return null;
    
    switch (verification.status) {
      case "APPROVED":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bgColor: "bg-green-50",
          message: "Your account has been verified!",
        };
      case "REJECTED":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          message: `Verification rejected: ${verification.rejectionReason || "Please review your documents"}`,
        };
      case "PENDING":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          message: "Your documents are under review. We'll notify you once approved.",
        };
      default:
        return null;
    }
  };

  const statusInfo = getVerificationStatus();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Complete Your Doctor Profile</h1>
            <p className="text-muted-foreground mt-2">
              Set up your profile and submit verification documents to start accepting appointments
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

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Complete your basic profile information</CardDescription>
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
              <Button onClick={handleProfileUpdate} disabled={!profileComplete || isLoading}>
                {isLoading ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Verification Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Documents</CardTitle>
              <CardDescription>
                Submit your documents for admin verification. You'll be able to accept appointments once approved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="license">Medical License *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="license"
                      value={documents.licenseUrl}
                      onChange={(e) => setDocuments({ ...documents, licenseUrl: e.target.value })}
                      placeholder="Document URL or upload file"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDocumentUpload("licenseUrl")}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="certificate">Professional Certificate (Optional)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="certificate"
                      value={documents.certificateUrl}
                      onChange={(e) => setDocuments({ ...documents, certificateUrl: e.target.value })}
                      placeholder="Document URL or upload file"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDocumentUpload("certificateUrl")}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="idDocument">ID Document (Optional)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="idDocument"
                      value={documents.idDocumentUrl}
                      onChange={(e) => setDocuments({ ...documents, idDocumentUrl: e.target.value })}
                      placeholder="Document URL or upload file"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDocumentUpload("idDocumentUrl")}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>

              {!documentsSubmitted && (
                <Button
                  onClick={handleDocumentSubmit}
                  disabled={!documents.licenseUrl || isSubmittingDocs}
                >
                  {isSubmittingDocs ? "Submitting..." : "Submit for Verification"}
                </Button>
              )}

              {documentsSubmitted && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Documents submitted on {verification?.submittedAt ? new Date(verification.submittedAt).toLocaleDateString() : "N/A"}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          {doctor.isVerified && profileComplete && (
            <div className="flex justify-end">
              <Button onClick={() => router.push("/doctor/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

