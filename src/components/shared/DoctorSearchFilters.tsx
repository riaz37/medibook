"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useDoctorFilterOptions, type DoctorSearchFilters as Filters } from "@/hooks/use-doctor-search";
import { format } from "date-fns";
import { 
  Search, 
  Filter, 
  X, 
  Star, 
  MapPin, 
  DollarSign, 
  Calendar as CalendarIcon,
  ChevronDown,
  Briefcase,
  SlidersHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DoctorSearchFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Partial<Filters>) => void;
  onClearFilters: () => void;
  totalResults?: number;
  className?: string;
}

export function DoctorSearchFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  totalResults,
  className,
}: DoctorSearchFiltersProps) {
  const { specialities, cities, states, isLoading } = useDoctorFilterOptions();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(
    filters.availableOn ? new Date(filters.availableOn) : undefined
  );

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== ""
  ).length;

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    onFiltersChange({
      availableOn: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search doctors by name or speciality..."
          value={filters.query || ""}
          onChange={(e) => onFiltersChange({ query: e.target.value || undefined })}
          className="pl-10 pr-4"
        />
      </div>

      {/* Quick Filters Row */}
      <div className="flex flex-wrap gap-2">
        {/* Speciality */}
        <Select
          value={filters.speciality || "all"}
          onValueChange={(v) => onFiltersChange({ speciality: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="w-[180px]">
            <Briefcase className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Speciality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialities</SelectItem>
            {specialities.map((spec) => (
              <SelectItem key={spec} value={spec}>
                {spec}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Location */}
        <Select
          value={filters.city || "all"}
          onValueChange={(v) => onFiltersChange({ city: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="w-[160px]">
            <MapPin className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Available On */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(
              "w-[180px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "MMM d, yyyy") : "Available on..."}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Sort By */}
        <Select
          value={`${filters.sortBy || "rating"}-${filters.sortOrder || "desc"}`}
          onValueChange={(v) => {
            const [sortBy, sortOrder] = v.split("-") as [Filters["sortBy"], "asc" | "desc"];
            onFiltersChange({ sortBy, sortOrder });
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating-desc">Top Rated</SelectItem>
            <SelectItem value="rating-asc">Lowest Rated</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="experience-desc">Most Experienced</SelectItem>
            <SelectItem value="reviews-desc">Most Reviews</SelectItem>
            <SelectItem value="name-asc">Name: A-Z</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          More Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            isAdvancedOpen && "rotate-180"
          )} />
        </Button>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            onClick={onClearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleContent>
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Minimum Rating */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Minimum Rating
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[filters.minRating || 0]}
                    onValueChange={([value]) => 
                      onFiltersChange({ minRating: value === 0 ? undefined : value })
                    }
                    max={5}
                    min={0}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm font-medium">
                    {filters.minRating || 0}+ ★
                  </span>
                </div>
              </div>

              {/* Maximum Price */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Max Consultation Fee
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="Any"
                    value={filters.maxPrice || ""}
                    onChange={(e) => 
                      onFiltersChange({ 
                        maxPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                      })
                    }
                    className="w-full"
                  />
                </div>
              </div>

              {/* Years of Experience */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  Min. Experience (years)
                </Label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={filters.yearsOfExperience || ""}
                  onChange={(e) => 
                    onFiltersChange({ 
                      yearsOfExperience: e.target.value ? parseInt(e.target.value) : undefined 
                    })
                  }
                />
              </div>
            </div>

            {/* Gender Filter */}
            <div className="space-y-2">
              <Label>Preferred Gender</Label>
              <div className="flex gap-2">
                <Button
                  variant={filters.gender === undefined ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFiltersChange({ gender: undefined })}
                >
                  Any
                </Button>
                <Button
                  variant={filters.gender === "MALE" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFiltersChange({ gender: "MALE" })}
                >
                  Male
                </Button>
                <Button
                  variant={filters.gender === "FEMALE" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFiltersChange({ gender: "FEMALE" })}
                >
                  Female
                </Button>
              </div>
            </div>

            {/* State Filter */}
            {states.length > 0 && (
              <div className="space-y-2">
                <Label>State</Label>
                <Select
                  value={filters.state || "all"}
                  onValueChange={(v) => onFiltersChange({ state: v === "all" ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Results Count */}
      {totalResults !== undefined && (
        <p className="text-sm text-muted-foreground">
          Found <span className="font-medium text-foreground">{totalResults}</span> doctor
          {totalResults !== 1 ? "s" : ""}
          {activeFiltersCount > 0 && " matching your criteria"}
        </p>
      )}
    </div>
  );
}
