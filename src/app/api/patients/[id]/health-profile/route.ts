import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireAnyRole } from "@/lib/server/rbac";
import { z } from "zod";

const updateHealthProfileSchema = z.object({
  bloodType: z.string().optional().nullable(),
  height: z.number().positive().optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  allergies: z.array(z.string()).optional().nullable(),
  chronicConditions: z.array(z.string()).optional().nullable(),
  currentMedications: z.array(z.string()).optional().nullable(),
  surgicalHistory: z.array(z.string()).optional().nullable(),
  familyHistory: z.array(z.string()).optional().nullable(),
  smokingStatus: z.enum(["never", "former", "current"]).optional().nullable(),
  alcoholUse: z.enum(["none", "occasional", "moderate", "heavy"]).optional().nullable(),
  exerciseFrequency: z.enum(["none", "rarely", "moderate", "frequent"]).optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),
});

// GET - Get patient's health profile
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    const { context } = authResult;

    // Patients can only view their own profile
    // Doctors can view profiles of their patients
    // Admins can view all profiles
    if (context.role === "patient" && context.userId !== patientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If doctor, verify they have treated this patient
    if (context.role === "doctor") {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: context.userId },
      });

      if (!doctor) {
        return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
      }

      const hasAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId: doctor.id,
          userId: patientId,
        },
      });

      if (!hasAppointment) {
        return NextResponse.json(
          { error: "You can only view health profiles of your patients" },
          { status: 403 }
        );
      }
    }

    let profile = await prisma.patientHealthProfile.findUnique({
      where: { patientId },
    });

    // If no profile exists, return empty profile structure
    if (!profile) {
      return NextResponse.json({
        profile: {
          patientId,
          bloodType: null,
          height: null,
          weight: null,
          dateOfBirth: null,
          allergies: [],
          chronicConditions: [],
          currentMedications: [],
          surgicalHistory: [],
          familyHistory: [],
          smokingStatus: null,
          alcoholUse: null,
          exerciseFrequency: null,
          emergencyContactName: null,
          emergencyContactPhone: null,
          emergencyContactRelation: null,
        },
      });
    }

    // Parse JSON fields
    const profileData = {
      ...profile,
      allergies: profile.allergies ? JSON.parse(profile.allergies) : [],
      chronicConditions: profile.chronicConditions ? JSON.parse(profile.chronicConditions) : [],
      currentMedications: profile.currentMedications ? JSON.parse(profile.currentMedications) : [],
      surgicalHistory: profile.surgicalHistory ? JSON.parse(profile.surgicalHistory) : [],
      familyHistory: profile.familyHistory ? JSON.parse(profile.familyHistory) : [],
    };

    return NextResponse.json({ profile: profileData });
  } catch (error) {
    console.error("Error fetching health profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch health profile" },
      { status: 500 }
    );
  }
}

// PUT - Update patient's health profile
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    const { context } = authResult;

    // Only patients can update their own profile, or admins
    if (context.role === "patient" && context.userId !== patientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (context.role === "doctor") {
      return NextResponse.json(
        { error: "Doctors cannot modify patient health profiles directly" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = updateHealthProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.issues },
        { status: 400 }
      );
    }

    const data = result.data;

    // Prepare data for update/create
    const profileData: any = {};

    if (data.bloodType !== undefined) profileData.bloodType = data.bloodType;
    if (data.height !== undefined) profileData.height = data.height;
    if (data.weight !== undefined) profileData.weight = data.weight;
    if (data.dateOfBirth !== undefined) {
      profileData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }
    if (data.allergies !== undefined) {
      profileData.allergies = data.allergies ? JSON.stringify(data.allergies) : null;
    }
    if (data.chronicConditions !== undefined) {
      profileData.chronicConditions = data.chronicConditions ? JSON.stringify(data.chronicConditions) : null;
    }
    if (data.currentMedications !== undefined) {
      profileData.currentMedications = data.currentMedications ? JSON.stringify(data.currentMedications) : null;
    }
    if (data.surgicalHistory !== undefined) {
      profileData.surgicalHistory = data.surgicalHistory ? JSON.stringify(data.surgicalHistory) : null;
    }
    if (data.familyHistory !== undefined) {
      profileData.familyHistory = data.familyHistory ? JSON.stringify(data.familyHistory) : null;
    }
    if (data.smokingStatus !== undefined) profileData.smokingStatus = data.smokingStatus;
    if (data.alcoholUse !== undefined) profileData.alcoholUse = data.alcoholUse;
    if (data.exerciseFrequency !== undefined) profileData.exerciseFrequency = data.exerciseFrequency;
    if (data.emergencyContactName !== undefined) profileData.emergencyContactName = data.emergencyContactName;
    if (data.emergencyContactPhone !== undefined) profileData.emergencyContactPhone = data.emergencyContactPhone;
    if (data.emergencyContactRelation !== undefined) profileData.emergencyContactRelation = data.emergencyContactRelation;

    const profile = await prisma.patientHealthProfile.upsert({
      where: { patientId },
      update: profileData,
      create: {
        patientId,
        ...profileData,
      },
    });

    // Parse JSON fields for response
    const responseProfile = {
      ...profile,
      allergies: profile.allergies ? JSON.parse(profile.allergies) : [],
      chronicConditions: profile.chronicConditions ? JSON.parse(profile.chronicConditions) : [],
      currentMedications: profile.currentMedications ? JSON.parse(profile.currentMedications) : [],
      surgicalHistory: profile.surgicalHistory ? JSON.parse(profile.surgicalHistory) : [],
      familyHistory: profile.familyHistory ? JSON.parse(profile.familyHistory) : [],
    };

    return NextResponse.json({ success: true, profile: responseProfile });
  } catch (error) {
    console.error("Error updating health profile:", error);
    return NextResponse.json(
      { error: "Failed to update health profile" },
      { status: 500 }
    );
  }
}
