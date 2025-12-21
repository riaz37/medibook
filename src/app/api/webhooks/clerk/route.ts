import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

/**
 * Clerk Webhook Handler
 * Automatically syncs users from Clerk to database
 * This is the scalable way to handle user sync - runs only on user events, not on every page load
 * 
 * Setup in Clerk Dashboard:
 * 1. Go to Webhooks section
 * 2. Add endpoint: https://yourdomain.com/api/webhooks/clerk
 * 3. Subscribe to: user.created, user.updated, user.deleted
 * 4. Copy the signing secret to CLERK_WEBHOOK_SECRET env variable
 */
export async function POST(req: Request) {
  try {
    // Get the Svix headers for verification
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Error occurred -- no svix headers", {
        status: 400,
      });
    }

    // Check if webhook secret is configured
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret.trim() === "") {
      console.error("CLERK_WEBHOOK_SECRET is not configured");
      return new Response("Webhook secret not configured", {
        status: 500,
      });
    }

    // Validate webhook secret format (should start with whsec_)
    const trimmedSecret = webhookSecret.trim();
    if (!trimmedSecret.startsWith("whsec_")) {
      console.error("CLERK_WEBHOOK_SECRET has invalid format - should start with 'whsec_'");
      console.error(`Secret length: ${trimmedSecret.length}, starts with: ${trimmedSecret.substring(0, 10)}...`);
      return new Response("Invalid webhook secret format - must start with 'whsec_'", {
        status: 500,
      });
    }

    // Get the body
    let payload;
    try {
      payload = await req.json();
    } catch (err) {
      console.error("Error parsing request body:", err);
      return new Response("Invalid request body", {
        status: 400,
      });
    }
    
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret
    let wh: Webhook;
    try {
      wh = new Webhook(trimmedSecret);
    } catch (err) {
      console.error("Error creating Webhook instance:", err);
      // Log additional details without exposing the secret
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`Webhook secret error: ${errorMessage}`);
      console.error(`Secret length: ${trimmedSecret.length}, format check: ${trimmedSecret.startsWith("whsec_") ? "valid prefix" : "invalid prefix"}`);
      return new Response("Invalid webhook secret format", {
        status: 500,
      });
    }

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook signature:", err);
      return new Response("Invalid webhook signature", {
        status: 400,
      });
    }

    // Handle the webhook
    const eventType = evt.type;

    // Type guard for user events
    if (evt.type !== "user.created" && evt.type !== "user.updated" && evt.type !== "user.deleted") {
      console.log(`Unhandled webhook event type: ${eventType}`);
      return new Response("Event type not handled", { status: 200 });
    }

    const userData = evt.data;
    const id = userData.id as string; // Type assertion: user events always have id

    // Extract user data (only available on user.created and user.updated)
    const email_addresses = "email_addresses" in userData ? userData.email_addresses : undefined;
    const first_name = "first_name" in userData ? userData.first_name : undefined;
    const last_name = "last_name" in userData ? userData.last_name : undefined;
    const phone_numbers = "phone_numbers" in userData ? userData.phone_numbers : undefined;

    try {
      switch (eventType) {
      case "user.created":
      case "user.updated": {
        // Sync user to database
        const email = email_addresses?.[0]?.email_address;
        if (!email) {
          console.error("User has no email address");
          break;
        }

        // TypeScript: email is guaranteed to be string here due to check above
        const userEmail: string = email;

        // Check if email is in admin list (from environment variable)
        // Format: ADMIN_EMAILS=admin1@example.com,admin2@example.com
        const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
        const isAdminEmail = adminEmails.includes(userEmail.toLowerCase());

        // Check for signup intent in Clerk metadata (set by client after signup)
        // This allows us to assign role based on which signup path was used
        const publicMetadata = "public_metadata" in userData ? userData.public_metadata : undefined;
        const signupIntent = (publicMetadata as { signupIntent?: string } | undefined)?.signupIntent;

        // Determine role based on signup path:
        // - Admin emails → ADMIN
        // - Patient signup path → PATIENT
        // - Doctor signup path → DOCTOR (immediately assigned)
        // - No intent (legacy/fallback) → PATIENT
        let assignedRole: "ADMIN" | "PATIENT" | "DOCTOR";
        if (isAdminEmail) {
          assignedRole = "ADMIN";
        } else if (signupIntent === "doctor") {
          assignedRole = "DOCTOR";
        } else {
          assignedRole = "PATIENT";
        }
        
        const roleForMetadata = assignedRole === "ADMIN" ? "admin" : 
                               assignedRole === "DOCTOR" ? "doctor" : "patient";

        // Use upsert to handle both create and update
        const dbUser = await prisma.user.upsert({
          where: { clerkId: id },
          update: {
            email: userEmail,
            firstName: first_name || undefined,
            lastName: last_name || undefined,
            phone: phone_numbers?.[0]?.phone_number || undefined,
            // Update role based on signup intent or admin email
            // For user.created: assign role based on signup intent
            // For user.updated: update role if signupIntent is set and user is still PATIENT
            ...(eventType === "user.created" && { role: assignedRole }),
            ...(eventType === "user.updated" && signupIntent === "doctor" && {
              role: "DOCTOR", // Update to DOCTOR if signupIntent is doctor (handles late intent setting)
            }),
            ...(isAdminEmail && { role: "ADMIN" }),
          },
          create: {
            clerkId: id,
            email: userEmail,
            firstName: first_name || undefined,
            lastName: last_name || undefined,
            phone: phone_numbers?.[0]?.phone_number || undefined,
            role: assignedRole,
          },
          include: { doctorProfile: { select: { id: true } } },
        });
        
        // If user.updated and signupIntent is doctor but user is still PATIENT, update role
        if (eventType === "user.updated" && signupIntent === "doctor" && dbUser.role === "PATIENT") {
          await prisma.user.update({
            where: { clerkId: id },
            data: { role: "DOCTOR" },
          });
          // Update dbUser reference for metadata sync
          const updatedUser = await prisma.user.findUnique({ where: { clerkId: id } });
          if (updatedUser) {
            Object.assign(dbUser, updatedUser);
          }
        }

        // Always sync Clerk metadata with database role for new users, admin emails, or when signupIntent changes
        // For existing users, sync if role changed or if signupIntent is set
        const shouldSyncMetadata = 
          eventType === "user.created" || 
          isAdminEmail || 
          !dbUser.role || // Sync if user has no role yet
          signupIntent === "doctor"; // Sync when doctor intent is detected

        if (shouldSyncMetadata) {
          const { clerkClient } = await import("@clerk/nextjs/server");
          const client = await clerkClient();
          
          // Get the current role from DB (may have been updated based on signupIntent)
          const currentRole = dbUser.role || assignedRole;
          const roleForClerk = currentRole === "ADMIN" ? "admin" : 
                               currentRole === "DOCTOR" ? "doctor" : "patient";
          
          // Get doctorId from profile if available
          const doctorId = dbUser.doctorProfile?.id || null;
          
          // Preserve signupIntent if it exists (for tracking which path user used)
          const existingMetadata = publicMetadata as { signupIntent?: string; doctorId?: string } | undefined;
          const metadataToSync: { role: string; signupIntent?: string; doctorId?: string } = {
            role: roleForClerk,
          };
          
          // Preserve signup intent if it was set
          if (signupIntent || existingMetadata?.signupIntent) {
            metadataToSync.signupIntent = signupIntent || existingMetadata?.signupIntent;
          }
          
          // Sync doctorId if available
          if (doctorId) {
            metadataToSync.doctorId = doctorId;
          }
          
          await client.users.updateUserMetadata(id, {
            publicMetadata: metadataToSync,
          });
        }

        // Also handle email-based lookup for existing users
        const existingByEmail = await prisma.user.findUnique({
          where: { email: userEmail },
        });

        if (existingByEmail && existingByEmail.clerkId !== id) {
          // Update clerkId if email matches but clerkId is different
          await prisma.user.update({
            where: { id: existingByEmail.id },
            data: { clerkId: id },
          });
        }

        break;
      }

      case "user.deleted": {
        // Optionally handle user deletion
        // You might want to soft delete instead of hard delete
        await prisma.user.delete({
          where: { clerkId: id },
        }).catch((err) => {
          // User might not exist in DB, that's okay
          console.log("User not found in DB for deletion:", err);
        });
        break;
      }
      }

      return new Response("Webhook processed", { status: 200 });
    } catch (dbError) {
      console.error("Error processing webhook database operations:", dbError);
      return new Response("Error processing webhook", { status: 500 });
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
}

