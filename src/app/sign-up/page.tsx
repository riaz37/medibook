"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Stethoscope, ArrowRight } from "lucide-react";

/**
 * Role Selection Page
 * 
 * Users select their role (Patient or Doctor) before signing up
 */
export default function RoleSelectionPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // User is already signed in, redirect based on role
      // This will be handled by the home page redirect logic
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleRoleSelection = (role: "patient" | "doctor") => {
    router.push(`/sign-up/${role}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4 py-12">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Welcome to Medibook
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose your role to get started. You can always change this later.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Patient Card */}
          <Card 
            className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
            onClick={() => handleRoleSelection("patient")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <CardTitle className="text-2xl">I'm a Patient</CardTitle>
              <CardDescription className="text-base">
                Book appointments, get health advice, and manage your care
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Free AI health assistant 24/7</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Book appointments instantly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Manage prescriptions & records</span>
                </li>
              </ul>
              <Button 
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleSelection("patient");
                }}
              >
                Continue as Patient
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Doctor Card */}
          <Card 
            className="relative overflow-hidden border-2 hover:border-secondary/50 transition-all duration-300 cursor-pointer group"
            onClick={() => handleRoleSelection("doctor")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
                  <Stethoscope className="w-6 h-6 text-secondary" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-all" />
              </div>
              <CardTitle className="text-2xl">I'm a Doctor</CardTitle>
              <CardDescription className="text-base">
                Join our platform and start accepting appointments
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5">✓</span>
                  <span>Low 3% commission rate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5">✓</span>
                  <span>Full dashboard & analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5">✓</span>
                  <span>Fast payouts & patient management</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleSelection("doctor");
                }}
              >
                Continue as Doctor
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto text-primary"
              onClick={() => router.push("/sign-in")}
            >
              Sign in
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
