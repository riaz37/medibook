"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SearchedDoctor } from "@/hooks/use-doctor-search";
import { 
  Star, 
  MapPin, 
  Clock, 
  Briefcase,
  Calendar,
  DollarSign,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

interface DoctorCardProps {
  doctor: SearchedDoctor;
  variant?: "default" | "compact";
}

const DoctorCardComponent = ({ doctor, variant = "default" }: DoctorCardProps) => {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const workingDays = doctor.workingHours
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((wh) => dayNames[wh.dayOfWeek]);

  const lowestPrice = doctor.appointmentTypes.length > 0
    ? Math.min(...doctor.appointmentTypes.map((at) => at.price || 0).filter(Boolean))
    : doctor.consultationFee;

  if (variant === "compact") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={doctor.imageUrl} alt={doctor.name} />
              <AvatarFallback>
                {doctor.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{doctor.name}</h3>
              <p className="text-sm text-muted-foreground">{doctor.speciality}</p>
              <div className="flex items-center gap-2 mt-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{doctor.rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">
                  ({doctor.totalReviews} reviews)
                </span>
              </div>
            </div>
            <Link href={`/patient/appointments/book?doctorId=${doctor.id}`}>
              <Button size="sm">Book</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Image and basic info */}
          <div className="md:w-1/3 p-6 flex flex-col items-center md:items-start gap-4 border-b md:border-b-0 md:border-r bg-muted/30">
            <Avatar className="h-24 w-24 md:h-32 md:w-32">
              <AvatarImage src={doctor.imageUrl} alt={doctor.name} />
              <AvatarFallback className="text-2xl">
                {doctor.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-semibold">{doctor.name}</h3>
              <Badge variant="secondary" className="mt-1">
                {doctor.speciality}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{doctor.rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({doctor.totalReviews} review{doctor.totalReviews !== 1 ? "s" : ""})
              </span>
            </div>
          </div>

          {/* Right side - Details */}
          <div className="md:w-2/3 p-6 flex flex-col">
            {/* Bio */}
            {doctor.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {doctor.bio}
              </p>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Location */}
              {(doctor.city || doctor.state) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {[doctor.city, doctor.state].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}

              {/* Experience */}
              {doctor.yearsOfExperience && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {doctor.yearsOfExperience} years experience
                  </span>
                </div>
              )}

              {/* Price */}
              {lowestPrice !== null && lowestPrice > 0 && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    From ${lowestPrice.toFixed(0)}
                  </span>
                </div>
              )}

              {/* Working Days */}
              {workingDays.length > 0 && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {workingDays.join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Appointment Types */}
            {doctor.appointmentTypes.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Available Services</p>
                <div className="flex flex-wrap gap-2">
                  {doctor.appointmentTypes.slice(0, 3).map((type) => (
                    <Badge key={type.id} variant="outline" className="text-xs">
                      {type.name}
                      {type.price && ` - $${type.price}`}
                    </Badge>
                  ))}
                  {doctor.appointmentTypes.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{doctor.appointmentTypes.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Languages */}
            {doctor.languages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Languages</p>
                <div className="flex flex-wrap gap-1">
                  {doctor.languages.map((lang) => (
                    <Badge key={lang} variant="secondary" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-auto flex items-center gap-3 pt-4 border-t">
              <Link href={`/patient/appointments/book?doctorId=${doctor.id}`} className="flex-1">
                <Button className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
              </Link>
              <Link href={`/doctors/${doctor.id}`}>
                <Button variant="outline" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Memoize component to prevent unnecessary re-renders
export const DoctorCard = React.memo(DoctorCardComponent);
