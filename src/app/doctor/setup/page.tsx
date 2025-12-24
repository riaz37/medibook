import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

async function DoctorSetupPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/");
  }

  // Check if user is a doctor
  const role = user.role?.name || user.userRole;
  if (role !== "DOCTOR" && role !== "doctor") {
    redirect("/");
  }

  // Get or create doctor profile
  let doctor = await prisma.doctor.findUnique({
    where: { userId: user.id },
  });

  if (!doctor) {
    // Create basic doctor profile
    doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Doctor",
        email: user.email,
        phone: user.phone || "",
        speciality: "",
        gender: "MALE", // Default, will be updated
        imageUrl: "",
      },
    });
  }

  // Get verification status (after migration, use: prisma.doctorVerification)
  const verification = await (prisma as any).doctorVerification?.findUnique({
    where: { doctorId: doctor.id },
  }).catch(() => null);

  // Redirect to settings page (setup is now part of settings)
  redirect("/doctor/settings");
}

export default DoctorSetupPage;

