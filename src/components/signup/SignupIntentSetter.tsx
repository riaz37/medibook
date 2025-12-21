"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

/**
 * Client component that sets signup intent in Clerk metadata after signup
 * This allows the webhook to assign the correct role based on signup path
 */
export default function SignupIntentSetter({ intent }: { intent: "patient" | "doctor" }) {
  const { isSignedIn, isLoaded, user } = useUser();
  const hasSetIntent = useRef(false);

  useEffect(() => {
    const setIntent = async () => {
      // Only set intent once per session
      if (hasSetIntent.current || !isLoaded || !isSignedIn || !user) {
        return;
      }

      // Check if intent is already set
      const metadata = user.publicMetadata as { signupIntent?: string; role?: string };
      if (metadata.signupIntent === intent) {
        hasSetIntent.current = true;
        return;
      }

      // Only set intent if user doesn't have a role yet (new signup)
      if (!metadata.role) {
        try {
          hasSetIntent.current = true;
          
          // Call API to set signup intent
          const response = await fetch("/api/users/set-signup-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intent }),
          });

          if (!response.ok) {
            console.error("Failed to set signup intent");
            hasSetIntent.current = false; // Allow retry
          }
        } catch (error) {
          console.error("Error setting signup intent:", error);
          hasSetIntent.current = false; // Allow retry
        }
      }
    };

    setIntent();
  }, [isLoaded, isSignedIn, user, intent]);

  return null;
}
