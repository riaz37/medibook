"use client";

/**
 * Legacy component - no longer needed with custom auth
 * Signup intent is set during the signup process
 */
export default function SignupIntentSetter({ intent }: { intent: "patient" | "doctor" }) {
  // This component is no longer needed with custom authentication
  // Role is assigned during signup via the sign-up API route
  return null;
}
