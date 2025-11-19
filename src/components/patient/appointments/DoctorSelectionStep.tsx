import { useAvailableDoctors } from "@/hooks/use-doctors";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { MapPinIcon, PhoneIcon, StarIcon, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DoctorCardsLoading } from "@/components/shared/appointments/DoctorCardsLoading";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";

interface DoctorSelectionStepProps {
  selectedDentistId: string | null;
  onSelectDentist: (dentistId: string) => void;
  onContinue: () => void;
}

function DoctorSelectionStep({
  onContinue,
  onSelectDentist,
  selectedDentistId,
}: DoctorSelectionStepProps) {
  const { data: doctors = [], isLoading } = useAvailableDoctors();
  const [searchQuery, setSearchQuery] = useState("");
  const [specialityFilter, setSpecialityFilter] = useState<string>("all");

  const specialities = useMemo(() => {
    const unique = new Set<string>();
    doctors.forEach((doctor) => {
      if (doctor.speciality) {
        unique.add(doctor.speciality);
      }
    });
    return Array.from(unique).sort();
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSpeciality = specialityFilter === "all" || doctor.speciality === specialityFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        doctor.name.toLowerCase().includes(query) ||
        doctor.speciality?.toLowerCase().includes(query) ||
        doctor.bio?.toLowerCase().includes(query);
      return matchesSpeciality && matchesSearch;
    });
  }, [doctors, searchQuery, specialityFilter]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === selectedDentistId) ?? null,
    [doctors, selectedDentistId]
  );

  if (isLoading)
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Choose Your Doctor</h2>
        <DoctorCardsLoading />
      </div>
    );

  if (doctors.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Choose Your Doctor</h2>
        <EmptyState
          icon={UserX}
          title="No doctors available"
          description="There are no doctors available at the moment. Please check back later or contact support."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide">Step 1</p>
          <h2 className="text-2xl font-semibold">Choose Your Doctor</h2>
          <p className="text-muted-foreground">
            Filter by speciality or search by name to find the right doctor faster.
          </p>
        </div>
        <div className="w-full md:w-auto flex flex-col gap-3 md:flex-row">
          <Input
            placeholder="Search by name or speciality..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="md:w-64"
          />
          {specialities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={specialityFilter === "all" ? "default" : "outline"}
                onClick={() => setSpecialityFilter("all")}
              >
                All
              </Button>
              {specialities.map((speciality) => (
                <Button
                  key={speciality}
                  size="sm"
                  variant={specialityFilter === speciality ? "default" : "outline"}
                  onClick={() => setSpecialityFilter(speciality)}
                >
                  {speciality}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filteredDoctors.length === 0 && (
        <Card>
          <CardContent className="py-6 text-center space-y-3">
            <p className="font-medium">No doctors match your filters</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or speciality filters to see more doctors.
            </p>
            {specialityFilter !== "all" && (
              <Button variant="ghost" onClick={() => setSpecialityFilter("all")}>
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => (
          <Card
            key={doctor.id}
            className={`cursor-pointer transition-all hover:shadow-lg focus-within:ring-2 focus-within:ring-primary ${
              selectedDentistId === doctor.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onSelectDentist(doctor.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectDentist(doctor.id);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Select ${doctor.name}, ${doctor.speciality || "General Practice"}`}
            aria-pressed={selectedDentistId === doctor.id}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <Image
                  src={doctor.imageUrl!}
                  alt={doctor.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <CardTitle className="text-lg">{doctor.name}</CardTitle>
                  <CardDescription className="text-primary font-medium">
                    {doctor.speciality || "General Practice"}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <StarIcon className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">5</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({doctor.appointmentCount} appointments)
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPinIcon className="w-4 h-4" />
                <span>Medibook</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PhoneIcon className="w-4 h-4" />
                <span>{doctor.phone}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {doctor.bio || "Experienced healthcare professional providing quality care."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Licensed</Badge>
                {doctor.speciality && <Badge variant="outline">{doctor.speciality}</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedDoctor && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Selected Doctor</p>
              <h3 className="text-xl font-semibold">{selectedDoctor.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedDoctor.speciality}</p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
              <div className="text-sm text-muted-foreground">
                Appointments completed:{" "}
                <span className="font-semibold text-foreground">{selectedDoctor.appointmentCount}</span>
              </div>
              <Button onClick={onContinue} className="min-w-[200px]">
                Continue to date & time
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
export default DoctorSelectionStep;
