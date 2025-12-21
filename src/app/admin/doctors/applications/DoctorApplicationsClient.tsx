"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { CheckCircle2, Clock, XCircle, User, Mail, Phone, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityListSkeleton } from "@/components/ui/loading-skeleton";
import type { DoctorApplication } from "@/lib/types/rbac";
import { ApplicationStatus } from "@prisma/client";

interface ApplicationWithUser extends DoctorApplication {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  };
}

export default function DoctorApplicationsClient() {
  const [applications, setApplications] = useState<ApplicationWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ApplicationStatus | "all">("all");
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithUser | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/doctors/applications");
      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = (application: ApplicationWithUser) => {
    setSelectedApplication(application);
    setAction("approve");
    setIsDialogOpen(true);
  };

  const handleReject = (application: ApplicationWithUser) => {
    setSelectedApplication(application);
    setAction("reject");
    setRejectionReason("");
    setIsDialogOpen(true);
  };

  const handleConfirmAction = async () => {
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
      fetchApplications();
    } catch (error) {
      console.error("Error processing application:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process application"
      );
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (activeTab === "all") return true;
    return app.status === activeTab;
  });

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "PENDING").length,
    approved: applications.filter((a) => a.status === "APPROVED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  if (isLoading) {
    return <ActivityListSkeleton count={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.all}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{counts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{counts.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{counts.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>Review and manage doctor applications</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ApplicationStatus | "all")}>
            <TabsList>
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="PENDING">Pending ({counts.pending})</TabsTrigger>
              <TabsTrigger value="APPROVED">Approved ({counts.approved})</TabsTrigger>
              <TabsTrigger value="REJECTED">Rejected ({counts.rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredApplications.length === 0 ? (
                <EmptyState
                  title="No applications found"
                  description={
                    activeTab === "all"
                      ? "No doctor applications have been submitted yet"
                      : `No ${activeTab.toLowerCase()} applications`
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
                                onClick={() => handleApprove(application)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(application)}
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
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve Application" : "Reject Application"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "Are you sure you want to approve this application? The user will be assigned the DOCTOR role."
                : "Please provide a reason for rejecting this application."}
            </DialogDescription>
          </DialogHeader>
          {action === "reject" && (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Explain why this application is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
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
  );
}
