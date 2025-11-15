import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DoctorSetupClient from "./DoctorSetupClient";

async function DoctorSetupPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/");
  }

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    include: { doctorProfile: true },
  });

  if (!dbUser || dbUser.role !== "DOCTOR") {
    redirect("/select-role");
  }

  // Get or create doctor profile
  let doctor = dbUser.doctorProfile;
  if (!doctor) {
    // Create basic doctor profile
    doctor = await prisma.doctor.create({
      data: {
        userId: dbUser.id,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.emailAddresses[0]?.emailAddress || "Doctor",
        email: user.emailAddresses[0]?.emailAddress || "",
        phone: user.phoneNumbers[0]?.phoneNumber || "",
        speciality: "",
        gender: "MALE", // Default, will be updated
        imageUrl: user.imageUrl || "",
      },
    });
  }

  // Get verification status (after migration, use: prisma.doctorVerification)
  const verification = await (prisma as any).doctorVerification?.findUnique({
    where: { doctorId: doctor.id },
  }).catch(() => null);

  return (
    <DoctorSetupClient
      doctor={doctor}
      verification={verification}
    />
  );
}

export default DoctorSetupPage;

