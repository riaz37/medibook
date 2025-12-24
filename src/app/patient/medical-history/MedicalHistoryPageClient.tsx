"use client";

import { useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import { HealthProfileCard } from "@/components/patient/medical-history/HealthProfileCard";
import { MedicalRecordsList } from "@/components/patient/medical-history/MedicalRecordsList";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MedicalRecord } from "@/hooks/use-medical-history";
import { format } from "date-fns";
import { Heart, FileText, User, ClipboardList } from "lucide-react";

export default function MedicalHistoryPageClient() {
  const { user, isLoaded } = useCurrentUser();
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  if (!isLoaded) {
    return (
      <PatientDashboardLayout>
        <div className="max-w-7xl mx-auto w-full">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </PatientDashboardLayout>
    );
  }

  if (!user) {
    return (
      <PatientDashboardLayout>
        <div className="max-w-7xl mx-auto w-full">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Please sign in to view your medical history</p>
            </CardContent>
          </Card>
        </div>
      </PatientDashboardLayout>
    );
  }

  return (
    <PatientDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Medical History</h1>
          <p className="text-muted-foreground">
            View your health profile and medical records
          </p>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Health Profile
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Medical Records
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <HealthProfileCard patientId={user.id} />
          </TabsContent>

          <TabsContent value="records" className="mt-6">
            <MedicalRecordsList
              patientId={user.id}
              onViewRecord={(record) => setSelectedRecord(record)}
            />
          </TabsContent>
        </Tabs>

        {/* Record Detail Dialog */}
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="max-w-2xl">
            {selectedRecord && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {selectedRecord.title}
                  </DialogTitle>
                  <DialogDescription>
                    <Badge variant="outline" className="mr-2">
                      {selectedRecord.recordType.replace("_", " ")}
                    </Badge>
                    <span className="text-sm">
                      {format(new Date(selectedRecord.recordDate), "MMMM d, yyyy")}
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {selectedRecord.diagnosis && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Diagnosis</h4>
                      <p>{selectedRecord.diagnosis}</p>
                    </div>
                  )}
                  {selectedRecord.description && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                      <p>{selectedRecord.description}</p>
                    </div>
                  )}
                  {selectedRecord.treatment && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Treatment</h4>
                      <p>{selectedRecord.treatment}</p>
                    </div>
                  )}
                  {selectedRecord.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                      <p className="text-sm">{selectedRecord.notes}</p>
                    </div>
                  )}
                  <div className="pt-4 border-t text-xs text-muted-foreground">
                    Created: {format(new Date(selectedRecord.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    {selectedRecord.updatedAt !== selectedRecord.createdAt && (
                      <> · Updated: {format(new Date(selectedRecord.updatedAt), "MMM d, yyyy 'at' h:mm a")}</>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PatientDashboardLayout>
  );
}

