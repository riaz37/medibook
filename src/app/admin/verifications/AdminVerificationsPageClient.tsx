"use client";

import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import DoctorVerifications from "@/components/admin/DoctorVerifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, XCircle, FileText, User, Mail, Phone, Calendar } from "lucide-react";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useAdminDoctorVerifications, useAdminDoctorApplications } from "@/hooks";
import type { VerificationStatus, VerificationWithDoctor } from "@/lib/types";
import type { DoctorApplication } from "@/lib/types/rbac";
import { ApplicationStatus } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";

interface ApplicationWithUser extends DoctorApplication {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  };
}

export default function AdminVerificationsPageClient() {
  const [activeTab, setActiveTab] = useState<"applications" | "verifications">("applications");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("all");
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | "all">("all");
  
  // Selected items for dialogs
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithUser | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<VerificationWithDoctor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch data
  const { data: allVerifications = [], isLoading: isLoadingVerifications } = useAdminDoctorVerifications();
  const { data: allApplications = [], isLoading: isLoadingApplications } = useAdminDoctorApplications();

  // Filter verifications by status
  const filteredVerifications = useMemo(() => {
    if (verificationStatus === "all") return allVerifications;
    return allVerifications.filter((v) => v.status === verificationStatus);
  }, [allVerifications, verificationStatus]);

  // Filter applications by status
  const filteredApplications = useMemo(() => {
    if (applicationStatus === "all") return allApplications;
    return allApplications.filter((a) => a.status === applicationStatus);
  }, [allApplications, applicationStatus]);

  // Calculate counts
  const verificationCounts = useMemo(() => {
    return {
      all: allVerifications.length,
      pending: allVerifications.filter((v) => v.status === "PENDING").length,
      approved: allVerifications.filter((v) => v.status === "APPROVED").length,
      rejected: allVerifications.filter((v) => v.status === "REJECTED").length,
    };
  }, [allVerifications]);

  const applicationCounts = useMemo(() => {
    return {
      all: allApplications.length,
      pending: allApplications.filter((a) => a.status === "PENDING").length,
      approved: allApplications.filter((a) => a.status === "APPROVED").length,
      rejected: allApplications.filter((a) => a.status === "REJECTED").length,
    };
  }, [allApplications]);

  const totalPending = verificationCounts.pending + applicationCounts.pending;

  // Handle application actions
  const handleApproveApplication = (application: ApplicationWithUser) => {
    setSelectedApplication(application);
    setSelectedVerification(null);
    setAction("approve");
    setIsDialogOpen(true);
  };

  const handleRejectApplication = (application: ApplicationWithUser) => {
    setSelectedApplication(application);
    setSelectedVerification(null);
    setAction("reject");
    setRejectionReason("");
    setIsDialogOpen(true);
  };

  const handleConfirmApplicationAction = async () => {
    if (!selectedApplication || !action) return;

    try {
      const response = await fetch(
        `/api/admin/doctors/applications/${selectedApplication.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: action === "approve" ? "approve" : "reject",
            rejectionReason: action === "reject" ? rejectionReason : undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process application");
      }

      toast.success(
        action === "approve"
          ? "Application approved successfully"
          : "Application rejected"
      );
      setIsDialogOpen(false);
      setSelectedApplication(null);
      setAction(null);
      setRejectionReason("");
      // Refetch will happen automatically via React Query
    } catch (error) {
      console.error("Error processing application:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process application"
      );
    }
  };

  // Handle verification actions
  const handleApproveVerification = (verification: VerificationWithDoctor) => {
    setSelectedVerification(verification);
    setSelectedApplication(null);
    setAction("approve");
    setIsDialogOpen(true);
  };

  const handleRejectVerification = (verification: VerificationWithDoctor) => {
    setSelectedVerification(verification);
    setSelectedApplication(null);
    setAction("reject");
    setRejectionReason("");
    setIsDialogOpen(true);
  };

  const handleConfirmVerificationAction = async () => {
    if (!selectedVerification || !action) return;

    try {
      const response = await fetch(
        `/api/admin/doctors/verification/${selectedVerification.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: action === "approve" ? "APPROVED" : "REJECTED",
            rejectionReason: action === "reject" ? rejectionReason : undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process verification");
      }

      toast.success(
        action === "approve"
          ? "Verification approved successfully"
          : "Verification rejected"
      );
      setIsDialogOpen(false);
      setSelectedVerification(null);
      setAction(null);
      setRejectionReason("");
      // Refetch will happen automatically via React Query
    } catch (error) {
      console.error("Error processing verification:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process verification"
      );
    }
  };

  const handleConfirmAction = () => {
    if (selectedApplication) {
      handleConfirmApplicationAction();
    } else if (selectedVerification) {
      handleConfirmVerificationAction();
    }
  };

  const isLoading = activeTab === "applications" ? isLoadingApplications : isLoadingVerifications;

  return (
    <AdminDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Verifications & Applications</h1>
          <p className="text-muted-foreground">
            Review and manage doctor applications and verification documents. Ensure all doctors meet the required standards.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{totalPending}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applicationCounts.all}</div>
              <p className="text-xs text-muted-foreground">Total applications</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verifications</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{verificationCounts.all}</div>
              <p className="text-xs text-muted-foreground">Total verifications</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {applicationCounts.approved + verificationCounts.approved}
              </div>
              <p className="text-xs text-muted-foreground">Total approved</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Review Items</CardTitle>
            <CardDescription>Manage doctor applications and verifications</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "applications" | "verifications")}>
              <TabsList className="mb-4">
                <TabsTrigger value="applications">
                  Applications
                  {applicationCounts.pending > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {applicationCounts.pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="verifications">
                  Verifications
                  {verificationCounts.pending > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {verificationCounts.pending}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Applications Tab */}
              <TabsContent value="applications" className="space-y-4">
                <Tabs value={applicationStatus} onValueChange={(v) => setApplicationStatus(v as ApplicationStatus | "all")}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All ({applicationCounts.all})</TabsTrigger>
                    <TabsTrigger value="PENDING">
                      Pending ({applicationCounts.pending})
                    </TabsTrigger>
                    <TabsTrigger value="APPROVED">Approved ({applicationCounts.approved})</TabsTrigger>
                    <TabsTrigger value="REJECTED">Rejected ({applicationCounts.rejected})</TabsTrigger>
                  </TabsList>

                  <TabsContent value={applicationStatus}>
                    {isLoading ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                        <p>Loading applications...</p>
                      </div>
                    ) : filteredApplications.length === 0 ? (
                      <EmptyState
                        title="No applications found"
                        description={
                          applicationStatus === "all"
                            ? "No doctor applications have been submitted yet"
                            : `No ${applicationStatus.toLowerCase()} applications`
                        }
                      />
                    ) : (
                      <div className="space-y-4">
                        {filteredApplications.map((application) => (
                          <Card key={application.id}>
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="space-y-4 flex-1">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <User className="h-5 w-5 text-muted-foreground" />
                                      <span className="font-medium">
                                        {application.user.firstName} {application.user.lastName}
                                      </span>
                                    </div>
                                    <Badge
                                      variant={
                                        application.status === "APPROVED"
                                          ? "default"
                                          : application.status === "REJECTED"
                                          ? "destructive"
                                          : "secondary"
                                      }
                                    >
                                      {application.status}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-muted-foreground" />
                                      <span>{application.user.email}</span>
                                    </div>
                                    {application.user.phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{application.user.phone}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">Speciality:</span>
                                      <span>{application.speciality}</span>
                                    </div>
                                    {application.licenseNumber && (
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">License:</span>
                                        <span>{application.licenseNumber}</span>
                                      </div>
                                    )}
                                    {application.yearsOfExperience && (
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">Experience:</span>
                                        <span>{application.yearsOfExperience} years</span>
                                      </div>
                                    )}
                                  </div>

                                  {application.bio && (
                                    <div className="text-sm text-muted-foreground">
                                      <p className="font-medium mb-1">Bio:</p>
                                      <p>{application.bio}</p>
                                    </div>
                                  )}

                                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    Submitted: {new Date(application.submittedAt).toLocaleDateString()}
                                  </div>

                                  {application.rejectionReason && (
                                    <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-3 rounded">
                                      <p className="font-medium mb-1">Rejection Reason:</p>
                                      <p>{application.rejectionReason}</p>
                                    </div>
                                  )}
                                </div>

                                {application.status === "PENDING" && (
                                  <div className="flex gap-2">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleApproveApplication(application)}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleRejectApplication(application)}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Verifications Tab */}
              <TabsContent value="verifications" className="space-y-4">
                <Tabs value={verificationStatus} onValueChange={(v) => setVerificationStatus(v as VerificationStatus)}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">
                      All
                      {verificationCounts.all > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {verificationCounts.all}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="PENDING">
                      Pending
                      {verificationCounts.pending > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {verificationCounts.pending}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="APPROVED">Approved</TabsTrigger>
                    <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
                  </TabsList>

                  <TabsContent value={verificationStatus}>
                    {isLoading ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                        <p>Loading verifications...</p>
                      </div>
                    ) : filteredVerifications.length === 0 ? (
                      <EmptyState
                        title="No verifications found"
                        description={
                          verificationStatus === "all"
                            ? "No doctor verifications have been submitted yet"
                            : `No ${verificationStatus.toLowerCase()} verifications`
                        }
                      />
                    ) : verificationStatus === "PENDING" ? (
                      <DoctorVerifications />
                    ) : (
                      <div className="space-y-4">
                        {filteredVerifications.map((verification) => (
                          <Card key={verification.id}>
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                  <Image
                                    src={verification.doctor.imageUrl || "/placeholder-doctor.png"}
                                    alt={verification.doctor.name}
                                    width={64}
                                    height={64}
                                    className="w-16 h-16 rounded-full object-cover"
                                  />
                                  <div>
                                    <h3 className="font-semibold text-lg">{verification.doctor.name}</h3>
                                    <p className="text-sm text-muted-foreground">{verification.doctor.email}</p>
                                    <p className="text-sm text-muted-foreground">{verification.doctor.speciality}</p>
                                    {verification.submittedAt && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Submitted: {new Date(verification.submittedAt).toLocaleDateString()}
                                      </p>
                                    )}
                                    {verification.reviewedAt && (
                                      <p className="text-xs text-muted-foreground">
                                        Reviewed: {new Date(verification.reviewedAt).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={
                                      verification.status === "APPROVED"
                                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                                        : verification.status === "REJECTED"
                                        ? "bg-red-500/10 text-red-600 border-red-500/20"
                                        : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                    }
                                  >
                                    {verification.status}
                                  </Badge>
                                  {verification.status === "PENDING" && (
                                    <>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleApproveVerification(verification)}
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Approve
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleRejectVerification(verification)}
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                              {verification.rejectionReason && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                  <p className="text-sm font-medium text-red-600 mb-1">Rejection Reason:</p>
                                  <p className="text-sm text-red-600/80">{verification.rejectionReason}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Action Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {action === "approve"
                  ? selectedApplication
                    ? "Approve Application"
                    : "Approve Verification"
                  : selectedApplication
                  ? "Reject Application"
                  : "Reject Verification"}
              </DialogTitle>
              <DialogDescription>
                {action === "approve"
                  ? selectedApplication
                    ? "Are you sure you want to approve this application? The user will be assigned the DOCTOR role."
                    : "Are you sure you want to approve this doctor's verification? They will be able to accept appointments."
                  : "Please provide a reason for rejecting this " +
                    (selectedApplication ? "application" : "verification") +
                    "."}
              </DialogDescription>
            </DialogHeader>
            {action === "reject" && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder={`Explain why this ${selectedApplication ? "application" : "verification"} is being rejected...`}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  rows={4}
                />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={action === "approve" ? "default" : "destructive"}
                onClick={handleConfirmAction}
                disabled={action === "reject" && !rejectionReason.trim()}
              >
                {action === "approve" ? "Approve" : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
}
