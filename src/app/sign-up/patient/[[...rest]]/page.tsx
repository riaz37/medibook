import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SignupIntentSetter from "@/components/signup/SignupIntentSetter";

/**
 * Patient Signup Page (Catch-all route for Clerk routing)
 * 
 * Users signing up via this path get PATIENT role immediately via webhook
 */
export default async function PatientSignUpPage() {
  const { userId } = await auth();

  // If user is already signed in, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Sign up as Patient</h1>
          <p className="text-muted-foreground">
            Create your account to book appointments and manage your healthcare
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg",
            },
          }}
          routing="path"
          path="/sign-up/patient"
          signInUrl="/sign-in"
          afterSignUpUrl="/patient/dashboard"
        />
        <SignupIntentSetter intent="patient" />
      </div>
    </div>
  );
}
