"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { toast } from "sonner";
import { Loader2, FileText, ExternalLink, X } from "lucide-react";
import type { DoctorApplicationData } from "@/lib/types/rbac";

/**
 * Doctor Application Form
 * 
 * Allows users to apply to become a doctor on the platform
 */
export default function DoctorApplicationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DoctorApplicationData>({
    speciality: "",
    licenseNumber: "",
    yearsOfExperience: undefined,
    bio: "",
    licenseUrl: "",
    certificateUrl: "",
    idDocumentUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/doctors/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit application");
      }

      toast.success("Application submitted successfully!");
      toast.info("Your application is under review. You'll be notified once it's processed.");
      
      // Redirect to patient dashboard (they're still a patient until approved)
      router.push("/patient/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof DoctorApplicationData, value: string | number | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doctor Application</CardTitle>
        <CardDescription>
          Please provide the following information to complete your application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="speciality">Speciality *</Label>
            <Input
              id="speciality"
              placeholder="e.g., Cardiology, Pediatrics, General Practice"
              value={formData.speciality}
              onChange={(e) => handleChange("speciality", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number</Label>
            <Input
              id="licenseNumber"
              placeholder="Your medical license number (optional)"
              value={formData.licenseNumber}
              onChange={(e) => handleChange("licenseNumber", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearsOfExperience">Years of Experience</Label>
            <Input
              id="yearsOfExperience"
              type="number"
              min="0"
              placeholder="Number of years"
              value={formData.yearsOfExperience || ""}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                handleChange("yearsOfExperience", value);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about your medical background and experience..."
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              rows={4}
            />
          </div>

          {/* Verification Documents Section */}
          <div className="space-y-6 pt-6 border-t">
            <div>
              <h3 className="text-lg font-semibold mb-2">Verification Documents</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please upload your verification documents. These will be reviewed by our admin team.
              </p>
            </div>

            {/* Medical License */}
            <div className="space-y-2">
              <Label htmlFor="licenseUrl">Medical License *</Label>
              {formData.licenseUrl ? (
                <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Medical License</p>
                    <p className="text-xs text-muted-foreground truncate">{formData.licenseUrl}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={formData.licenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <Button variant="ghost" size="sm" type="button">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => handleChange("licenseUrl", "")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <FileUpload
                  onUploadComplete={(url) => {
                    handleChange("licenseUrl", url);
                    toast.success("Medical license uploaded successfully");
                  }}
                  onUploadError={(error) => {
                    toast.error(error.message || "Failed to upload file");
                  }}
                  folder="doctor-verifications"
                  maxSize={10 * 1024 * 1024}
                  accept="image/*,.pdf,.doc,.docx"
                  label="Upload Medical License"
                />
              )}
              <Input
                id="licenseUrl"
                value={formData.licenseUrl}
                onChange={(e) => handleChange("licenseUrl", e.target.value)}
                placeholder="Or enter document URL manually"
                disabled={!!formData.licenseUrl}
                className="text-sm mt-2"
              />
            </div>

            {/* Professional Certificate */}
            <div className="space-y-2">
              <Label htmlFor="certificateUrl">Professional Certificate (Optional)</Label>
              {formData.certificateUrl ? (
                <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Professional Certificate</p>
                    <p className="text-xs text-muted-foreground truncate">{formData.certificateUrl}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={formData.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <Button variant="ghost" size="sm" type="button">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => handleChange("certificateUrl", "")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <FileUpload
                  onUploadComplete={(url) => {
                    handleChange("certificateUrl", url);
                    toast.success("Certificate uploaded successfully");
                  }}
                  onUploadError={(error) => {
                    toast.error(error.message || "Failed to upload file");
                  }}
                  folder="doctor-verifications"
                  maxSize={10 * 1024 * 1024}
                  accept="image/*,.pdf,.doc,.docx"
                  label="Upload Certificate"
                />
              )}
              <Input
                id="certificateUrl"
                value={formData.certificateUrl}
                onChange={(e) => handleChange("certificateUrl", e.target.value)}
                placeholder="Or enter document URL manually"
                disabled={!!formData.certificateUrl}
                className="text-sm mt-2"
              />
            </div>

            {/* ID Document */}
            <div className="space-y-2">
              <Label htmlFor="idDocumentUrl">ID Document (Optional)</Label>
              {formData.idDocumentUrl ? (
                <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">ID Document</p>
                    <p className="text-xs text-muted-foreground truncate">{formData.idDocumentUrl}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={formData.idDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <Button variant="ghost" size="sm" type="button">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => handleChange("idDocumentUrl", "")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <FileUpload
                  onUploadComplete={(url) => {
                    handleChange("idDocumentUrl", url);
                    toast.success("ID document uploaded successfully");
                  }}
                  onUploadError={(error) => {
                    toast.error(error.message || "Failed to upload file");
                  }}
                  folder="doctor-verifications"
                  maxSize={10 * 1024 * 1024}
                  accept="image/*,.pdf,.doc,.docx"
                  label="Upload ID Document"
                />
              )}
              <Input
                id="idDocumentUrl"
                value={formData.idDocumentUrl}
                onChange={(e) => handleChange("idDocumentUrl", e.target.value)}
                placeholder="Or enter document URL manually"
                disabled={!!formData.idDocumentUrl}
                className="text-sm mt-2"
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting || !formData.licenseUrl} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
