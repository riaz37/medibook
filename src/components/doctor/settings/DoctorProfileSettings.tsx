"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useUpdateDoctor } from "@/hooks";
import type { Gender } from "@/lib/types";

const SPECIALITIES = [
    "General Practice",
    "Cardiology",
    "Dermatology",
    "Endocrinology",
    "Gastroenterology",
    "Neurology",
    "Oncology",
    "Orthopedics",
    "Pediatrics",
    "Psychiatry",
    "Pulmonology",
    "Rheumatology",
    "Urology",
    "Other",
];

interface DoctorProfileSettingsProps {
    doctor: {
        id: string;
        name: string;
        phone: string;
        speciality: string;
        bio?: string | null;
        gender: Gender;
    };
    onUpdate?: () => void;
}

export function DoctorProfileSettings({ doctor, onUpdate }: DoctorProfileSettingsProps) {
    const [formData, setFormData] = useState({
        name: doctor.name,
        phone: doctor.phone,
        speciality: doctor.speciality,
        bio: doctor.bio || "",
        gender: doctor.gender,
    });

    const updateDoctorMutation = useUpdateDoctor();

    const profileComplete = formData.name && formData.phone && formData.speciality && formData.gender;

    const handleProfileUpdate = async () => {
        if (!profileComplete) {
            toast.error("Please fill in all required fields");
            return;
        }

        updateDoctorMutation.mutate(
            {
                id: doctor.id,
                ...formData,
            },
            {
                onSuccess: () => {
                    toast.success("Profile updated successfully");
                    onUpdate?.();
                },
                onError: (error) => {
                    console.error("Error updating profile:", error);
                    toast.error(error instanceof Error ? error.message : "Failed to update profile");
                },
            }
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your basic profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="speciality">Speciality *</Label>
                        <Select
                            value={formData.speciality}
                            onValueChange={(value) => setFormData({ ...formData, speciality: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select speciality" />
                            </SelectTrigger>
                            <SelectContent>
                                {SPECIALITIES.map((spec) => (
                                    <SelectItem key={spec} value={spec}>
                                        {spec}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="gender">Gender *</Label>
                        <Select
                            value={formData.gender}
                            onValueChange={(value) => setFormData({ ...formData, gender: value as Gender })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MALE">Male</SelectItem>
                                <SelectItem value="FEMALE">Female</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell patients about your experience and expertise..."
                        rows={4}
                    />
                </div>
                <Button onClick={handleProfileUpdate} disabled={!profileComplete || updateDoctorMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {updateDoctorMutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
            </CardContent>
        </Card>
    );
}
