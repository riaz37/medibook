"use client";

import { usePrescriptionById, useDownloadPrescriptionPDF, useProcessRefill } from "@/hooks/use-prescription";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FileText, Download, Check, X, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { PrescriptionDetailsSkeleton } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const statusColors = {
  ACTIVE: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  EXPIRED: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  CANCELLED: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  COMPLETED: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
};

interface PrescriptionDetailsProps {
  prescriptionId: string;
}

export function PrescriptionDetails({ prescriptionId }: PrescriptionDetailsProps) {
  const { data: prescription, isLoading, error } = usePrescriptionById(prescriptionId);
  const downloadPDF = useDownloadPrescriptionPDF();
  const processRefill = useProcessRefill();

  const [processingRefill, setProcessingRefill] = useState<string | null>(null);

  if (isLoading) {
    return <PrescriptionDetailsSkeleton />;
  }

  if (error || !prescription) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load prescription</p>
          <Link href="/doctor/prescriptions">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Prescriptions
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const patientName = `${prescription.patient.firstName || ""} ${prescription.patient.lastName || ""}`.trim() || prescription.patient.email;

  const handleProcessRefill = async (itemId: string, status: "APPROVED" | "REJECTED") => {
    setProcessingRefill(itemId);
    try {
      await processRefill.mutateAsync({
        prescriptionId: prescription.id,
        itemId,
        data: { status },
      });
    } finally {
      setProcessingRefill(null);
    }
  };

  const pendingRefills = prescription.items
    .flatMap((item: typeof prescription.items[0]) =>
      item.refills
        .filter((refill: typeof item.refills[0]) => refill.status === "PENDING")
        .map((refill: typeof item.refills[0]) => ({ item, refill }))
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/doctor/prescriptions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <Button
          onClick={() => downloadPDF.mutate(prescription.id)}
          disabled={downloadPDF.isPending}
        >
          {downloadPDF.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Prescription Details</CardTitle>
              <CardDescription>Prescription ID: {prescription.id}</CardDescription>
            </div>
            <Badge variant="outline" className={statusColors[prescription.status as keyof typeof statusColors]}>
              {prescription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Patient Information</h3>
              <p className="text-sm text-muted-foreground">{patientName}</p>
              <p className="text-sm text-muted-foreground">{prescription.patient.email}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Prescription Information</h3>
              <p className="text-sm text-muted-foreground">
                Issue Date: {format(new Date(prescription.issueDate), "MMMM d, yyyy")}
              </p>
              {prescription.expiryDate && (
                <p className="text-sm text-muted-foreground">
                  Expiry Date: {format(new Date(prescription.expiryDate), "MMMM d, yyyy")}
                </p>
              )}
              {prescription.appointment && (
                <p className="text-sm text-muted-foreground">
                  Appointment: {format(new Date(prescription.appointment.date), "MMMM d, yyyy")}
                </p>
              )}
            </div>
          </div>

          {prescription.notes && (
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{prescription.notes}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-4">Medications</h3>
            <div className="space-y-4">
              {prescription.items.map((item: typeof prescription.items[0], index: number) => {
                const pendingRefill = item.refills.find((r: typeof item.refills[0]) => r.status === "PENDING");
                return (
                  <Card key={item.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {index + 1}. {item.medicationName}
                        </h4>
                        {pendingRefill && (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
                            Refill Pending
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Dosage:</span> {item.dosage}
                        </div>
                        <div>
                          <span className="font-medium">Frequency:</span> {item.frequency}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {item.duration}
                        </div>
                        {item.quantity && (
                          <div>
                            <span className="font-medium">Quantity:</span> {item.quantity}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Refills:</span> {item.refillsRemaining} of {item.refillsAllowed} remaining
                        </div>
                      </div>
                      {item.instructions && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Instructions:</span> {item.instructions}
                        </div>
                      )}
                      {pendingRefill && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                          <p className="text-sm font-medium mb-2">Refill Request Pending</p>
                          {pendingRefill.notes && (
                            <p className="text-sm text-muted-foreground mb-2">{pendingRefill.notes}</p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleProcessRefill(item.id, "APPROVED")}
                              disabled={processingRefill === item.id}
                            >
                              {processingRefill === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleProcessRefill(item.id, "REJECTED")}
                              disabled={processingRefill === item.id}
                            >
                              {processingRefill === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <X className="w-4 h-4 mr-2" />
                                  Reject
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

