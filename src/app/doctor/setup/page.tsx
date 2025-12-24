import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getAuthContext } from "@/lib/server/rbac";

async function DoctorSetupPage() {
  const user = await getCurrentUser();
  
  if (!user || !user.role) {
    redirect("/sign-in");
  }

  // Check email verification
  if (!user.emailVerified) {
    redirect("/verify-email");
  }

  // Check if user is a doctor (pending or verified) or admin
  const context = await getAuthContext();
  if (!context || (context.role !== "doctor" && context.role !== "doctor_pending" && context.role !== "admin")) {
    redirect("/sign-in");
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

