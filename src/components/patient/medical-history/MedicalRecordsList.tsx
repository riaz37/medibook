"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMedicalRecords, type MedicalRecord } from "@/hooks/use-medical-history";
import { format } from "date-fns";
import {
  FileText,
  Stethoscope,
  FlaskConical,
  Image,
  Syringe,
  AlertTriangle,
  Scissors,
  Heart,
  Pill,
  StickyNote,
  Loader2,
  ChevronRight,
  Filter,
} from "lucide-react";

interface MedicalRecordsListProps {
  patientId: string;
  onViewRecord?: (record: MedicalRecord) => void;
}

const recordTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  CONSULTATION: { label: "Consultation", icon: Stethoscope, color: "bg-blue-100 text-blue-700" },
  DIAGNOSIS: { label: "Diagnosis", icon: FileText, color: "bg-purple-100 text-purple-700" },
  TREATMENT: { label: "Treatment", icon: Heart, color: "bg-green-100 text-green-700" },
  LAB_RESULT: { label: "Lab Result", icon: FlaskConical, color: "bg-yellow-100 text-yellow-700" },
  IMAGING: { label: "Imaging", icon: Image, color: "bg-cyan-100 text-cyan-700" },
  VACCINATION: { label: "Vaccination", icon: Syringe, color: "bg-teal-100 text-teal-700" },
  ALLERGY: { label: "Allergy", icon: AlertTriangle, color: "bg-red-100 text-red-700" },
  SURGERY: { label: "Surgery", icon: Scissors, color: "bg-orange-100 text-orange-700" },
  CHRONIC_CONDITION: { label: "Chronic Condition", icon: Heart, color: "bg-pink-100 text-pink-700" },
  MEDICATION: { label: "Medication", icon: Pill, color: "bg-indigo-100 text-indigo-700" },
  GENERAL_NOTE: { label: "General Note", icon: StickyNote, color: "bg-gray-100 text-gray-700" },
};

export function MedicalRecordsList({ patientId, onViewRecord }: MedicalRecordsListProps) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data, isLoading, error } = useMedicalRecords(patientId, {
    type: selectedType === "all" ? undefined : selectedType,
    limit,
    offset: page * limit,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-destructive text-center">Failed to load medical records</p>
        </CardContent>
      </Card>
    );
  }

  const records = data?.records || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Medical Records
            </CardTitle>
            <CardDescription>
              {total} record{total !== 1 ? "s" : ""} found
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setPage(0); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(recordTypeConfig).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No medical records</h3>
            <p className="text-muted-foreground">
              {selectedType === "all"
                ? "Your medical records will appear here"
                : `No ${recordTypeConfig[selectedType]?.label.toLowerCase() || selectedType} records found`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const config = recordTypeConfig[record.recordType] || recordTypeConfig.GENERAL_NOTE;
              const Icon = config.icon;

              return (
                <div
                  key={record.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onViewRecord?.(record)}
                >
                  <div className={`p-2 rounded-lg ${config.color.split(" ")[0]}`}>
                    <Icon className={`h-5 w-5 ${config.color.split(" ")[1]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{record.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {record.description || record.diagnosis || record.notes || "No description"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(record.recordDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
