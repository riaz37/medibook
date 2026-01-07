"use client";

import { useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useDoctorSearch } from "@/hooks/use-doctor-search";
import { DoctorSearchFilters } from "@/components/shared/DoctorSearchFilters";
import { DoctorCard, DoctorListSkeleton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  AlertCircle,
  X,
  Scale
} from "lucide-react";
import type { SearchedDoctor } from "@/hooks/use-doctor-search";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

function DoctorComparisonView({
  doctors,
  onRemove,
  onClear
}: {
  doctors: SearchedDoctor[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  if (doctors.length === 0) return null;

  return (
    <Card className="mb-6 border-primary/30">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Comparing {doctors.length} Doctor{doctors.length !== 1 ? "s" : ""}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear} className="h-8 text-xs sm:text-sm">
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => {
            const lowestPrice = doctor.appointmentTypes.length > 0
              ? Math.min(...doctor.appointmentTypes.map((at) => at.price || 0).filter(Boolean))
              : doctor.consultationFee;

            return (
              <Card key={doctor.id} className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => onRemove(doctor.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={doctor.imageUrl} alt={doctor.name} />
                      <AvatarFallback>
                        {doctor.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{doctor.name}</h4>
                      <p className="text-sm text-muted-foreground">{doctor.speciality}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Rating</span>
                      <Badge variant="secondary">{doctor.rating.toFixed(1)} ⭐</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Reviews</span>
                      <span>{doctor.totalReviews}</span>
                    </div>
                    {doctor.yearsOfExperience && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Experience</span>
                        <span>{doctor.yearsOfExperience} years</span>
                      </div>
                    )}
                    {lowestPrice !== null && lowestPrice > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Price</span>
                        <span className="font-semibold">${lowestPrice.toFixed(0)}+</span>
                      </div>
                    )}
                    {(doctor.city || doctor.state) && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Location</span>
                        <span className="text-xs">{[doctor.city, doctor.state].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                  </div>
                  <Link href={`/patient/appointments/book?doctorId=${doctor.id}`} className="mt-4 block">
                    <Button size="sm" className="w-full">Book Appointment</Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function FindAndBookContent() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedDoctors, setSelectedDoctors] = useState<Set<string>>(new Set());

  const initialFilters = {
    query: searchParams.get("query") || undefined,
    speciality: searchParams.get("speciality") || undefined,
    city: searchParams.get("city") || undefined,
  };

  const {
    doctors,
    pagination,
    filters,
    isLoading,
    isError,
    error,
    updateFilters,
    clearFilters,
    page,
    nextPage,
    prevPage,
    goToPage,
  } = useDoctorSearch({ initialFilters });

  const selectedDoctorsList = useMemo(() => {
    return doctors.filter(d => selectedDoctors.has(d.id));
  }, [doctors, selectedDoctors]);

  const toggleDoctorSelection = (doctorId: string) => {
    setSelectedDoctors(prev => {
      const next = new Set(prev);
      if (next.has(doctorId)) {
        next.delete(doctorId);
      } else {
        if (next.size < 3) { // Limit to 3 doctors for comparison
          next.add(doctorId);
        }
      }
      return next;
    });
  };

  const handleRemoveFromComparison = (doctorId: string) => {
    setSelectedDoctors(prev => {
      const next = new Set(prev);
      next.delete(doctorId);
      return next;
    });
  };

  const handleClearComparison = () => {
    setSelectedDoctors(new Set());
    setCompareMode(false);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div>
        <DoctorSearchFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
          totalResults={pagination?.total}
        />
      </div>

      {/* Comparison View */}
      {selectedDoctors.size > 0 && (
        <DoctorComparisonView
          doctors={selectedDoctorsList}
          onRemove={handleRemoveFromComparison}
          onClear={handleClearComparison}
        />
      )}

      {/* View Mode Toggle and Results Count */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            aria-label="List view"
            className="h-9 w-9"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
            className="h-9 w-9"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={compareMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setCompareMode(!compareMode);
              if (compareMode) {
                setSelectedDoctors(new Set());
              }
            }}
            className="h-9"
          >
            <Scale className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Compare</span>
            {selectedDoctors.size > 0 && (
              <span className="ml-1">({selectedDoctors.size})</span>
            )}
          </Button>
        </div>

        {pagination && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="hidden sm:inline">
              {pagination.total} {pagination.total === 1 ? "doctor" : "doctors"} found
              {pagination.totalPages > 1 && ` • Page ${pagination.page} of ${pagination.totalPages}`}
            </span>
            <span className="sm:hidden">
              {pagination.total} found{pagination.totalPages > 1 && ` • ${pagination.page}/${pagination.totalPages}`}
            </span>
          </p>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <DoctorListSkeleton count={3} />
      ) : isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error loading doctors</h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "Something went wrong"}
            </p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      ) : doctors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No doctors found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search criteria
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {compareMode && (
            <div className="mb-4 p-3 sm:p-4 bg-muted/50 rounded-lg border border-primary/20">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Select up to 3 doctors to compare. {typeof window !== "undefined" && window.innerWidth >= 640 ? "Click the checkbox" : "Tap the checkbox"} on each doctor card to add them to comparison.
              </p>
            </div>
          )}
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
            : "space-y-4"
          }>
            {doctors.map((doctor) => (
              <div key={doctor.id} className="relative">
                {compareMode && (
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 bg-background rounded p-1 shadow-sm">
                    <Checkbox
                      checked={selectedDoctors.has(doctor.id)}
                      onCheckedChange={() => toggleDoctorSelection(doctor.id)}
                      disabled={!selectedDoctors.has(doctor.id) && selectedDoctors.size >= 3}
                      className="h-5 w-5"
                    />
                  </div>
                )}
                <div className={compareMode && selectedDoctors.has(doctor.id) ? "ring-2 ring-primary rounded-lg" : ""}>
                  <DoctorCard
                    doctor={doctor}
                    variant={viewMode === "grid" ? "compact" : "default"}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prevPage}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(
                  1,
                  Math.min(
                    pagination.totalPages - 4,
                    page - 2
                  )
                ) + i;

                if (pageNum > pagination.totalPages) return null;

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => goToPage(pageNum)}
                    aria-label={`Page ${pageNum}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="icon"
                onClick={nextPage}
                disabled={!pagination.hasMore}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function FindAndBookTab() {
  return (
    <Suspense fallback={<DoctorListSkeleton count={3} />}>
      <FindAndBookContent />
    </Suspense>
  );
}
