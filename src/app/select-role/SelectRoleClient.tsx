"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/generated/prisma/client";
import { User, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { usersService } from "@/lib/services";

export default function SelectRoleClient() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    setIsLoading(true);
    try {
      const user = await usersService.selectRole(selectedRole);
      
      // Redirect based on role
      if (user.role === "DOCTOR") {
        router.push("/doctor/setup"); // Redirect to setup first
      } else {
        router.push("/patient/dashboard");
      }
    } catch (error) {
      console.error("Error selecting role:", error);
      toast.error(error instanceof Error ? error.message : "Failed to set role");
      setIsLoading(false);
    }
  };

  const roles = [
    {
      value: UserRole.PATIENT,
      title: "Patient",
      description: "Book appointments and manage your healthcare",
      icon: User,
      features: [
        "Book appointments with doctors",
        "View appointment history",
        "Manage your profile",
      ],
    },
    {
      value: UserRole.DOCTOR,
      title: "Doctor",
      description: "Manage your practice, appointments, and patients",
      icon: Stethoscope,
      features: [
        "Manage your appointments",
        "View patient information",
        "Update availability",
      ],
    },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-6 py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Choose Your Role</h1>
            <p className="text-muted-foreground text-lg">
              Select how you want to use Medibook
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.value;

              return (
                <Card
                  key={role.value}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-primary border-2 shadow-lg scale-105"
                      : "hover:border-primary/50 hover:shadow-md"
                  }`}
                  onClick={() => setSelectedRole(role.value)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{role.title}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {role.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleRoleSelection}
              disabled={!selectedRole || isLoading}
              size="lg"
              className="min-w-[200px]"
            >
              {isLoading ? "Setting up..." : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

