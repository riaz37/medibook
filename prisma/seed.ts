import { PrismaClient, Gender } from "@prisma/client";

const prisma = new PrismaClient();

function generateAvatar(name: string, gender: "MALE" | "FEMALE") {
  const username = name.replace(/\s+/g, "").toLowerCase();
  const base = "https://avatar.iran.liara.run/public";
  if (gender === "FEMALE") return `${base}/girl?username=${username}`;
  return `${base}/boy?username=${username}`;
}

const dentists = [
  {
    name: "Dr. Fatima Rahman",
    email: "fatima.rahman@dentify.com",
    phone: "+880 1712-345678",
    speciality: "General Dentistry",
    bio: "With over 10 years of experience, Dr. Rahman specializes in preventive care and patient education.",
    gender: Gender.FEMALE,
    isActive: true,
  },
  {
    name: "Dr. Hasan Ahmed",
    email: "hasan.ahmed@dentify.com",
    phone: "+880 1712-456789",
    speciality: "Orthodontics",
    bio: "Expert in braces and Invisalign treatments. Helping patients achieve their perfect smile.",
    gender: Gender.MALE,
    isActive: true,
  },
  {
    name: "Dr. Ayesha Begum",
    email: "ayesha.begum@dentify.com",
    phone: "+880 1712-567890",
    speciality: "Cosmetic Dentistry",
    bio: "Passionate about smile makeovers, teeth whitening, and veneers. Transforming smiles since 2015.",
    gender: Gender.FEMALE,
    isActive: true,
  },
  {
    name: "Dr. Karim Hossain",
    email: "karim.hossain@dentify.com",
    phone: "+880 1712-678901",
    speciality: "Oral Surgery",
    bio: "Board-certified oral surgeon specializing in wisdom teeth removal and dental implants.",
    gender: Gender.MALE,
    isActive: true,
  },
  {
    name: "Dr. Sharmin Islam",
    email: "sharmin.islam@dentify.com",
    phone: "+880 1712-789012",
    speciality: "Pediatric Dentistry",
    bio: "Dedicated to making dental visits fun and comfortable for children. Kid-friendly specialist.",
    gender: Gender.FEMALE,
    isActive: true,
  },
  {
    name: "Dr. Rahim Uddin",
    email: "rahim.uddin@dentify.com",
    phone: "+880 1712-890123",
    speciality: "Periodontics",
    bio: "Expert in gum disease treatment and prevention. Restoring healthy smiles through advanced periodontal care.",
    gender: Gender.MALE,
    isActive: true,
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing doctors (optional - remove if you want to keep existing data)
  console.log("🗑️  Clearing existing doctors...");
  await prisma.doctor.deleteMany({});

  // Create dentists
  console.log("👨‍⚕️ Creating dentists...");
  for (const dentist of dentists) {
    const doctor = await prisma.doctor.create({
      data: {
        ...dentist,
        imageUrl: generateAvatar(dentist.name, dentist.gender),
      },
    });
    console.log(`   ✓ Created ${doctor.name} (${doctor.speciality})`);
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

