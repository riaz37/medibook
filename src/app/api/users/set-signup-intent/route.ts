import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * API route to set signup intent in Clerk metadata
 * This is called after user signs up to track which path they used
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { intent } = await req.json();

    if (intent !== "patient" && intent !== "doctor") {
      return NextResponse.json(
        { error: "Invalid intent. Must be 'patient' or 'doctor'" },
        { status: 400 }
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Check if user already has a role
    const currentMetadata = user.publicMetadata as { role?: string; signupIntent?: string };
    
    // Set intent and update role if needed
    const updatedMetadata: { role?: string; signupIntent: string } = {
      ...currentMetadata,
      signupIntent: intent,
    };

    // If intent is "doctor" and user doesn't have a role yet (or is PATIENT), assign DOCTOR role
    if (intent === "doctor" && (!currentMetadata.role || currentMetadata.role === "patient")) {
      updatedMetadata.role = "doctor";
      
      // Update database role to DOCTOR (use upsert in case user doesn't exist yet)
      const { default: prisma } = await import("@/lib/prisma");
      const email = user.emailAddresses[0]?.emailAddress;
      if (email) {
        await prisma.user.upsert({
          where: { clerkId: userId },
          update: { role: "DOCTOR" },
          create: {
            clerkId: userId,
            email,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            phone: user.phoneNumbers[0]?.phoneNumber || undefined,
            role: "DOCTOR",
          },
        });
      }
    } else if (intent === "patient" && !currentMetadata.role) {
      // If intent is "patient" and no role, assign PATIENT role
      updatedMetadata.role = "patient";
      
      // Update database role to PATIENT (use upsert in case user doesn't exist yet)
      const { default: prisma } = await import("@/lib/prisma");
      const email = user.emailAddresses[0]?.emailAddress;
      if (email) {
        await prisma.user.upsert({
          where: { clerkId: userId },
          update: { role: "PATIENT" },
          create: {
            clerkId: userId,
            email,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            phone: user.phoneNumbers[0]?.phoneNumber || undefined,
            role: "PATIENT",
          },
        });
      }
    }

    await client.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting signup intent:", error);
    return NextResponse.json(
      { error: "Failed to set signup intent" },
      { status: 500 }
    );
  }
}
