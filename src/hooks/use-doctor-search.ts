import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";

export interface DoctorSearchFilters {
  query?: string;
  speciality?: string;
  city?: string;
  state?: string;
  minRating?: number;
  maxPrice?: number;
  availableOn?: string;
  gender?: "MALE" | "FEMALE";
  yearsOfExperience?: number;
  sortBy?: "rating" | "price" | "experience" | "name" | "reviews";
  sortOrder?: "asc" | "desc";
}

export interface SearchedDoctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  speciality: string;
  bio: string | null;
  imageUrl: string;
  gender: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  rating: number;
  totalReviews: number;
  yearsOfExperience: number | null;
  consultationFee: number | null;
  languages: string[];
  education: string[];
  certifications: string[];
  appointmentTypes: Array<{
    id: string;
    name: string;
    duration: number;
    price: number | null;
  }>;
  workingHours: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  appointmentCount: number;
  reviewCount: number;
}

export interface DoctorSearchResponse {
  doctors: SearchedDoctor[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  filters: DoctorSearchFilters;
}

interface UseDoctorSearchOptions {
  initialFilters?: DoctorSearchFilters;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useDoctorSearch(options: UseDoctorSearchOptions = {}) {
  const [filters, setFilters] = useState<DoctorSearchFilters>(
    options.initialFilters || {}
  );
  const [page, setPage] = useState(options.page || 1);
  const limit = options.limit || 20;

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    
    if (filters.query) params.set("query", filters.query);
    if (filters.speciality) params.set("speciality", filters.speciality);
    if (filters.city) params.set("city", filters.city);
    if (filters.state) params.set("state", filters.state);
    if (filters.minRating !== undefined) params.set("minRating", filters.minRating.toString());
    if (filters.maxPrice !== undefined) params.set("maxPrice", filters.maxPrice.toString());
    if (filters.availableOn) params.set("availableOn", filters.availableOn);
    if (filters.gender) params.set("gender", filters.gender);
    if (filters.yearsOfExperience !== undefined) params.set("yearsOfExperience", filters.yearsOfExperience.toString());
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
    params.set("page", page.toString());
    params.set("limit", limit.toString());
    
    return params.toString();
  }, [filters, page, limit]);

  const query = useQuery<DoctorSearchResponse>({
    queryKey: ["doctorSearch", filters, page, limit],
    queryFn: async () => {
      const response = await fetch(`/api/doctors/search?${buildQueryString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to search doctors");
      }
      return response.json();
    },
    enabled: options.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateFilters = useCallback((newFilters: Partial<DoctorSearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const nextPage = useCallback(() => {
    if (query.data?.pagination.hasMore) {
      setPage((p) => p + 1);
    }
  }, [query.data?.pagination.hasMore]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage((p) => p - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    doctors: query.data?.doctors || [],
    pagination: query.data?.pagination,
    filters,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updateFilters,
    clearFilters,
    setFilters,
    page,
    nextPage,
    prevPage,
    goToPage,
    refetch: query.refetch,
  };
}

// Hook to fetch filter options (specialities, cities, etc.)
export function useDoctorFilterOptions() {
  const specialitiesQuery = useQuery<{ specialities: string[] }>({
    queryKey: ["doctorSpecialities"],
    queryFn: async () => {
      const response = await fetch("/api/doctors/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "specialities" }),
      });
      if (!response.ok) throw new Error("Failed to fetch specialities");
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const locationsQuery = useQuery<{ cities: string[]; states: string[] }>({
    queryKey: ["doctorLocations"],
    queryFn: async () => {
      const response = await fetch("/api/doctors/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "locations" }),
      });
      if (!response.ok) throw new Error("Failed to fetch locations");
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return {
    specialities: specialitiesQuery.data?.specialities || [],
    cities: locationsQuery.data?.cities || [],
    states: locationsQuery.data?.states || [],
    isLoading: specialitiesQuery.isLoading || locationsQuery.isLoading,
  };
}
