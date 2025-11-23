import { NextRequest, NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { usersServerService, doctorsServerService } from "@/lib/services/server";
import { UserRole } from "@prisma/client";
import { selectRoleSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";

export async function POST(request: NextRequest) {
  try {
    // Middleware ensures user is authenticated
    const user = await currentUser();
    if (!user) {
      // This should never happen if middleware is working correctly
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(selectRoleSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { role } = validation.data;
    const client = await clerkClient();

    // Check if user already exists
    const existingUser = await usersServerService.findUniqueByClerkId(user.id, {
      doctorProfile: true,
    });

    let doctorId: string | null = null;

    if (existingUser) {
      // Update role in database
      const updatedUser = await usersServerService.updateRole(existingUser.id, role as UserRole);
      const userWithProfile = await usersServerService.findUniqueWithDoctorProfile(updatedUser.id);

      // If role is DOCTOR, create or link doctor profile
      if (role === UserRole.DOCTOR && !(userWithProfile as any)?.doctorProfile) {
        const email = user.emailAddresses[0]?.emailAddress || "";
        
        // Check if doctor profile already exists with this email
        const existingDoctor = await doctorsServerService.findUniqueByEmail(email);

        if (existingDoctor) {
          // Link existing doctor profile to user
          await doctorsServerService.update(existingDoctor.id, { userId: updatedUser.id });
          doctorId = existingDoctor.id;
        } else {
          // Create new doctor profile
          const newDoctor = await doctorsServerService.create({
            userId: updatedUser.id,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || email || "Doctor",
            email,
            phone: user.phoneNumbers[0]?.phoneNumber || "",
            speciality: "", // Will be set during profile completion
            gender: "MALE", // Will be set during profile completion
            imageUrl: user.imageUrl || "",
          });
          doctorId = newDoctor.id;
        }
      } else if ((userWithProfile as any)?.doctorProfile) {
        doctorId = (userWithProfile as any).doctorProfile.id;
      }

      // Update Clerk metadata with role and doctorId
      await client.users.updateUserMetadata(user.id, {
        publicMetadata: {
          role: role.toLowerCase(), // Store as lowercase: "patient", "doctor", "admin"
          ...(doctorId && { doctorId }),
        },
      });

      return NextResponse.json(updatedUser);
    }

    // Create new user with selected role
    const email = user.emailAddresses[0]?.emailAddress || "";
    const dbUser = await usersServerService.syncFromClerk(user.id, {
      email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phoneNumbers[0]?.phoneNumber,
      role: role as UserRole,
    });

    // If role is DOCTOR, create doctor profile
    if (role === UserRole.DOCTOR) {
      const newDoctor = await doctorsServerService.create({
        userId: dbUser.id,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || email || "Doctor",
        email,
        phone: user.phoneNumbers[0]?.phoneNumber || "",
        speciality: "", // Will be set during profile completion
        gender: "MALE", // Will be set during profile completion
        imageUrl: user.imageUrl || "",
      });
      doctorId = newDoctor.id;
    }

    // Update Clerk metadata with role and doctorId
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        role: role.toLowerCase(), // Store as lowercase: "patient", "doctor", "admin"
        ...(doctorId && { doctorId }),
      },
    });

    return NextResponse.json(dbUser);
  } catch (error) {
    console.error("Error in select-role API route", error);
    return NextResponse.json(
      { error: "Failed to set role" },
      { status: 500 }
    );
  }
}

