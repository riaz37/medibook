"use client";

import { usePrescriptionById, useDownloadPrescriptionPDF, useRequestRefill } from "@/hooks/use-prescription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Download, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { PrescriptionDetailsSkeleton } from "@/components/shared";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const statusColors = {
  ACTIVE: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  EXPIRED: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  CANCELLED: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  COMPLETED: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
};

interface PrescriptionDetailsProps {
  prescriptionId: string;
}

export function PatientPrescriptionDetails({ prescriptionId }: PrescriptionDetailsProps) {
  const { data: prescription, isLoading, error } = usePrescriptionById(prescriptionId);
  const downloadPDF = useDownloadPrescriptionPDF();
  const requestRefill = useRequestRefill();

  const [refillDialogOpen, setRefillDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [refillNotes, setRefillNotes] = useState("");

  if (isLoading) {
    return <PrescriptionDetailsSkeleton />;
  }

  if (error || !prescription) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load prescription</p>
          <Link href="/patient/prescriptions">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Prescriptions
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleRequestRefill = async () => {
    if (!selectedItemId) return;

    try {
      await requestRefill.mutateAsync({
        prescriptionId: prescription.id,
        itemId: selectedItemId,
        data: { notes: refillNotes || null },
      });
      setRefillDialogOpen(false);
      setRefillNotes("");
      setSelectedItemId(null);
    } catch (error) {
      console.error("Error requesting refill:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/patient/prescriptions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
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
              <p className="text-sm text-muted-foreground">Prescription ID: {prescription.id}</p>
            </div>
            <Badge variant="outline" className={statusColors[prescription.status as keyof typeof statusColors]}>
              {prescription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Prescribing Physician</h3>
              <p className="text-sm text-muted-foreground">Dr. {prescription.doctor.name}</p>
              <p className="text-sm text-muted-foreground">{prescription.doctor.speciality}</p>
              <p className="text-sm text-muted-foreground">{prescription.doctor.email}</p>
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
                const canRequestRefill = item.refillsRemaining > 0 && prescription.status === "ACTIVE";
                const hasPendingRefill = item.refills.some((r: typeof item.refills[0]) => r.status === "PENDING");

                return (
                  <Card key={item.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {index + 1}. {item.medicationName}
                        </h4>
                        {hasPendingRefill && (
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
                      {canRequestRefill && !hasPendingRefill && (
                        <Dialog open={refillDialogOpen && selectedItemId === item.id} onOpenChange={(open) => {
                          setRefillDialogOpen(open);
                          if (!open) {
                            setSelectedItemId(null);
                            setRefillNotes("");
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedItemId(item.id);
                                setRefillDialogOpen(true);
                              }}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Request Refill
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Request Refill</DialogTitle>
                              <DialogDescription>
                                Request a refill for {item.medicationName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="refill-notes">Notes (Optional)</Label>
                                <Textarea
                                  id="refill-notes"
                                  value={refillNotes}
                                  onChange={(e) => setRefillNotes(e.target.value)}
                                  placeholder="Any additional information for your doctor..."
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setRefillDialogOpen(false);
                                  setSelectedItemId(null);
                                  setRefillNotes("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleRequestRefill}
                                disabled={requestRefill.isPending}
                              >
                                {requestRefill.isPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  "Submit Request"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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

