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

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
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

        // Determine role: admin if email matches, otherwise default to PATIENT
        const defaultRole = isAdminEmail ? "ADMIN" : "PATIENT";
        const roleForMetadata = isAdminEmail ? "admin" : "patient";

        // Use upsert to handle both create and update
        const dbUser = await prisma.user.upsert({
          where: { clerkId: id },
          update: {
            email: userEmail,
            firstName: first_name || undefined,
            lastName: last_name || undefined,
            phone: phone_numbers?.[0]?.phone_number || undefined,
            // Only update role if it's a new user (user.created) or if email is admin
            // For existing users, preserve their current role unless they're an admin
            ...(eventType === "user.created" && { role: defaultRole }),
            ...(isAdminEmail && { role: "ADMIN" }),
          },
          create: {
            clerkId: id,
            email: userEmail,
            firstName: first_name || undefined,
            lastName: last_name || undefined,
            phone: phone_numbers?.[0]?.phone_number || undefined,
            role: defaultRole,
          },
        });

        // Update Clerk metadata with role (important for session claims)
        if (isAdminEmail || eventType === "user.created") {
          const { clerkClient } = await import("@clerk/nextjs/server");
          const client = await clerkClient();
          await client.users.updateUserMetadata(id, {
            publicMetadata: {
              role: roleForMetadata,
            },
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
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
}

