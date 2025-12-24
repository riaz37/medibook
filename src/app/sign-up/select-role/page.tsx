"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Stethoscope, User } from "lucide-react";

export default function SelectRolePage() {
  const router = useRouter();

  const handleRoleSelect = (role: "patient" | "doctor") => {
    router.push(`/sign-up?role=${role}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Medibook" width={48} height={48} />
          </div>
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Choose your role to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Patient Option */}
            <Card 
              className="cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-lg"
              onClick={() => handleRoleSelect("patient")}
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">I am a Patient</h3>
                  <p className="text-sm text-muted-foreground">
                    Book appointments, access medical records, and get healthcare advice
                  </p>
                </div>
                <Button className="w-full" onClick={() => handleRoleSelect("patient")}>
                  Continue as Patient
                </Button>
              </CardContent>
            </Card>

            {/* Doctor Option */}
            <Card 
              className="cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-lg"
              onClick={() => handleRoleSelect("doctor")}
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Stethoscope className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">I am a Doctor</h3>
                  <p className="text-sm text-muted-foreground">
                    Join our network of healthcare professionals and help patients
                  </p>
                </div>
                <Button className="w-full" onClick={() => handleRoleSelect("doctor")}>
                  Continue as Doctor
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <Link href="/" className="text-sm text-center text-muted-foreground hover:text-primary block">
            ← Back to home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

