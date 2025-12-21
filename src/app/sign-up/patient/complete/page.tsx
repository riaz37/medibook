"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * Patient signup completion page
 * Redirects to dashboard after signup intent is set
 */
export default function PatientSignupCompletePage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Wait a moment for signup intent to be set, then redirect
      const timer = setTimeout(() => {
        router.push("/patient/dashboard");
      }, 1000);

      return () => clearTimeout(timer);
    } else if (isLoaded && !isSignedIn) {
      // Not signed in, redirect to signup
      router.push("/sign-up/patient");
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Setting up your account...</p>
      </div>
    </div>
  );
}
