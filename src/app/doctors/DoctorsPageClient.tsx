"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PatientDashboardLayout } from "@/components/patient/layout/PatientDashboardLayout";
import { useDoctorSearch } from "@/hooks/use-doctor-search";
import { DoctorSearchFilters } from "@/components/shared/DoctorSearchFilters";
import { DoctorCard } from "@/components/shared/DoctorCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Stethoscope, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  LayoutGrid,
  List,
  AlertCircle
} from "lucide-react";

function DoctorsPageContent() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            Find a Doctor
          </h1>
          <p className="text-muted-foreground">
            Search our network of verified healthcare professionals
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <DoctorSearchFilters
            filters={filters}
            onFiltersChange={updateFilters}
            onClearFilters={clearFilters}
            totalResults={pagination?.total}
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          {pagination && (
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </p>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <Skeleton className="h-32 w-32 rounded-full" />
                    <div className="flex-1 space-y-4">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 gap-4" 
            : "space-y-4"
          }>
            {doctors.map((doctor) => (
              <DoctorCard 
                key={doctor.id} 
                doctor={doctor}
                variant={viewMode === "grid" ? "compact" : "default"}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevPage}
              disabled={page === 1}
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
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DoctorsPageClient() {
  return (
    <PatientDashboardLayout>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <DoctorsPageContent />
      </Suspense>
    </PatientDashboardLayout>
  );
}

