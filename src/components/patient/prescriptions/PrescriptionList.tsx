"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePatientPrescriptions } from "@/hooks/use-prescription";
import { format } from "date-fns";
import { FileText, Search, Download, Eye } from "lucide-react";
import Link from "next/link";
import { PageLoading } from "@/components/ui/loading-skeleton";

const statusColors = {
  ACTIVE: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  EXPIRED: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  CANCELLED: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  COMPLETED: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
};

function PatientPrescriptionListComponent() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = usePatientPrescriptions({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  if (isLoading) {
    return <PageLoading message="Loading prescriptions..." />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load prescriptions</p>
        </CardContent>
      </Card>
    );
  }

  const prescriptions = data?.prescriptions || [];
  const filteredPrescriptions = prescriptions.filter((prescription) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return prescription.id.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Prescriptions</h2>
        <p className="text-muted-foreground">View and manage your prescriptions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search prescriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No prescriptions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription) => (
                <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            Dr. {prescription.doctor.name}
                          </h3>
                          <Badge variant="outline" className={statusColors[prescription.status as keyof typeof statusColors]}>
                            {prescription.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Issue Date:</span>{" "}
                            {format(new Date(prescription.issueDate), "MMM d, yyyy")}
                          </div>
                          {prescription.expiryDate && (
                            <div>
                              <span className="font-medium">Expiry:</span>{" "}
                              {format(new Date(prescription.expiryDate), "MMM d, yyyy")}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Medications:</span> {prescription.items.length}
                          </div>
                          <div>
                            <span className="font-medium">Speciality:</span> {prescription.doctor.speciality}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Link href={`/patient/prescriptions/${prescription.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/api/prescriptions/${prescription.id}/pdf`} target="_blank">
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export const PatientPrescriptionList = React.memo(PatientPrescriptionListComponent);

