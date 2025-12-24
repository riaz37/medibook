import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function DoctorSetupPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  // Check if user is a doctor
  if (user.userRole !== "DOCTOR") {
    redirect("/");
  }

  // Get or create doctor profile
  let doctor = user.doctorProfile;
  if (!doctor) {
    // Create basic doctor profile
    doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Doctor",
        email: user.email || "",
        phone: user.phone || "",
        speciality: "",
        gender: "MALE", // Default, will be updated
        imageUrl: "/placeholder-doctor.png",
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

