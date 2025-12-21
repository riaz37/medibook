import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DoctorApplicationForm from "@/components/doctor/DoctorApplicationForm";
import SignupIntentSetter from "@/components/signup/SignupIntentSetter";
import { getUserRoleFromSession } from "@/lib/server/rbac";

/**
 * Doctor Application Signup Page (Catch-all route for Clerk routing)
 * 
 * Two-step process:
 * 1. User signs up with Clerk (gets PATIENT role but with doctor intent)
 * 2. After signup, they fill out doctor application form
 * 3. Application is submitted for admin review
 */
export default async function DoctorSignUpPage() {
  const { userId } = await auth();

  // If user is already signed in, check if they have a role
  if (userId) {
    const role = await getUserRoleFromSession();
    
    if (role === "doctor") {
      redirect("/doctor/dashboard");
    } else if (role === "admin") {
      redirect("/admin");
    } else if (role === "patient") {
      // If they're a patient, show application form
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4 py-12">
          <div className="w-full max-w-2xl space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Apply to be a Doctor</h1>
              <p className="text-muted-foreground">
                Complete your application to join our platform as a healthcare provider
              </p>
            </div>
            <DoctorApplicationForm />
          </div>
        </div>
      );
    }
    
    // If signed in but no role yet, show application form
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4 py-12">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Apply to be a Doctor</h1>
            <p className="text-muted-foreground">
              Complete your application to join our platform as a healthcare provider
            </p>
          </div>
          <DoctorApplicationForm />
        </div>
      </div>
    );
  }

  // Not signed in - show signup form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Apply to be a Doctor</h1>
          <p className="text-muted-foreground">
            Sign up and complete your application to join our platform
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
          path="/sign-up/doctor"
          signInUrl="/sign-in"
          afterSignUpUrl="/sign-up/doctor"
        />
        <SignupIntentSetter intent="doctor" />
      </div>
    </div>
  );
}
