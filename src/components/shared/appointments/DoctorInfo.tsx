import { useAvailableDoctors } from "@/hooks/use-doctors";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function DoctorInfo({ doctorId }: { doctorId: string }) {
  const { data: doctors = [] } = useAvailableDoctors();
  const doctor = doctors.find((d) => d.id === doctorId);

  if (!doctor) return null;

  const initials = doctor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-4">
      <Avatar className="w-12 h-12">
        <AvatarImage 
          src={doctor.imageUrl && doctor.imageUrl.trim() !== "" ? doctor.imageUrl : undefined} 
          alt={doctor.name} 
        />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-medium">{doctor.name}</h3>
        <p className="text-sm text-muted-foreground">{doctor.speciality || "General Practice"}</p>
      </div>
    </div>
  );
}

export default DoctorInfo;
