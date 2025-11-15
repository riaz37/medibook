"use client";

import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import DoctorsManagement from "@/components/admin/DoctorsManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchIcon, XCircleIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useGetAllDoctorsForAdmin } from "@/hooks/use-doctors";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { EditIcon, MailIcon, PhoneIcon } from "lucide-react";
import AddDoctorDialog from "@/components/admin/AddDoctorDialog";
import EditDoctorDialog from "@/components/admin/EditDoctorDialog";
import type { Doctor } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityListSkeleton } from "@/components/ui/loading-skeleton";

function AdminDoctorsPage() {
  const { data: doctors = [], isLoading } = useGetAllDoctorsForAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Filter doctors
  const filteredDoctors = useMemo(() => {
    let filtered = doctors;

    // Apply status filter
    if (statusFilter === "verified") {
      filtered = filtered.filter((doc) => doc.isVerified);
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((doc) => !doc.isVerified);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((doctor) => {
        return (
          doctor.name.toLowerCase().includes(query) ||
          doctor.email.toLowerCase().includes(query) ||
          doctor.speciality.toLowerCase().includes(query) ||
          doctor.phone?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [doctors, statusFilter, searchQuery]);

  const handleEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedDoctor(null);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "all";

  // Calculate counts
  const counts = useMemo(() => {
    return {
      all: doctors.length,
      verified: doctors.filter((d) => d.isVerified).length,
      pending: doctors.filter((d) => !d.isVerified).length,
    };
  }, [doctors]);

  return (
    <AdminDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Doctors Management</h1>
          <p className="text-muted-foreground">
            Manage and oversee all doctors in your practice. Add, edit, and verify doctor profiles.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.all}</div>
              <p className="text-xs text-muted-foreground">All registered doctors</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{counts.verified}</div>
              <p className="text-xs text-muted-foreground">Approved and active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{counts.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting verification</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <CardTitle>Doctors</CardTitle>
                <CardDescription>Manage all registered doctors</CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Users className="w-4 h-4 mr-2" />
                Add Doctor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search doctors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:bg-transparent"
                    onClick={() => setSearchQuery("")}
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Doctors List */}
            {isLoading ? (
              <ActivityListSkeleton count={5} />
            ) : filteredDoctors.length === 0 ? (
              <EmptyState
                icon={Users}
                title={hasActiveFilters ? "No doctors found" : "No doctors yet"}
                description={
                  hasActiveFilters
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "Add your first doctor to get started managing your practice."
                }
                action={
                  !hasActiveFilters
                    ? {
                        label: "Add Doctor",
                        onClick: () => setIsAddDialogOpen(true),
                      }
                    : undefined
                }
              />
            ) : (
              <div className="space-y-4">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Image
                        src={doctor.imageUrl}
                        alt={doctor.name}
                        width={48}
                        height={48}
                        className="size-12 rounded-full object-cover ring-2 ring-background"
                      />

                      <div>
                        <div className="font-semibold">{doctor.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {doctor.speciality}
                          <span className="ml-2 px-2 py-0.5 bg-muted rounded text-xs">
                            {doctor.gender === "MALE" ? "Male" : "Female"}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MailIcon className="h-3 w-3" />
                            {doctor.email}
                          </div>
                          {doctor.phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <PhoneIcon className="h-3 w-3" />
                              {doctor.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="font-semibold text-primary">{doctor.appointmentCount || 0}</div>
                        <div className="text-xs text-muted-foreground">Appointments</div>
                      </div>

                      {doctor.isVerified ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3"
                        onClick={() => handleEditDoctor(doctor)}
                      >
                        <EditIcon className="size-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddDoctorDialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} />
      <EditDoctorDialog
        key={selectedDoctor?.id}
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        doctor={selectedDoctor}
      />
    </AdminDashboardLayout>
  );
}

export default AdminDoctorsPage;

