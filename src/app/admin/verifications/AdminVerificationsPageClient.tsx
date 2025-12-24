"use client";

import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import DoctorVerifications from "@/components/admin/DoctorVerifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useAdminDoctorVerifications } from "@/hooks";
import type { VerificationStatus, VerificationWithDoctor } from "@/lib/types";

export default function AdminVerificationsPageClient() {
  const [activeTab, setActiveTab] = useState<VerificationStatus>("all");

  // Fetch all verifications
  const { data: allVerifications = [], isLoading } = useAdminDoctorVerifications();

  // Filter verifications by status
  const filteredVerifications = useMemo(() => {
    if (activeTab === "all") return allVerifications;
    return allVerifications.filter((v) => v.status === activeTab);
  }, [allVerifications, activeTab]);

  // Calculate counts
  const counts = useMemo(() => {
    return {
      all: allVerifications.length,
      pending: allVerifications.filter((v) => v.status === "PENDING").length,
      approved: allVerifications.filter((v) => v.status === "APPROVED").length,
      rejected: allVerifications.filter((v) => v.status === "REJECTED").length,
    };
  }, [allVerifications]);

  return (
    <AdminDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Doctor Verifications</h1>
          <p className="text-muted-foreground">
            Review and approve doctor verification documents. Ensure all doctors meet the required standards.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.all}</div>
              <p className="text-xs text-muted-foreground">All verifications</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{counts.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{counts.approved}</div>
              <p className="text-xs text-muted-foreground">Verified doctors</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{counts.rejected}</div>
              <p className="text-xs text-muted-foreground">Rejected verifications</p>
            </CardContent>
          </Card>
        </div>

        {/* Verifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Verifications</CardTitle>
            <CardDescription>Review and manage doctor verification requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as VerificationStatus)}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">
                  All
                  {counts.all > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {counts.all}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="PENDING">
                  Pending
                  {counts.pending > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {counts.pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="APPROVED">Approved</TabsTrigger>
                <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                    <p>Loading verifications...</p>
                  </div>
                ) : filteredVerifications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No verifications found</p>
                  </div>
                ) : activeTab === "PENDING" ? (
                  <DoctorVerifications />
                ) : (
                  <div className="space-y-4">
                    {filteredVerifications.map((verification) => (
                      <Card key={verification.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <Image
                                src={verification.doctor.imageUrl}
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
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
}

