"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHealthProfile, useUpdateHealthProfile, type HealthProfile } from "@/hooks/use-medical-history";
import { toast } from "sonner";
import { 
  Heart, 
  Ruler, 
  Scale, 
  Calendar, 
  AlertTriangle, 
  Pill, 
  Scissors,
  Users,
  Cigarette,
  Wine,
  Dumbbell,
  Phone,
  Edit2,
  Plus,
  X,
  Loader2,
  Save
} from "lucide-react";

interface HealthProfileCardProps {
  patientId: string;
  readonly?: boolean;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function HealthProfileCard({ patientId, readonly = false }: HealthProfileCardProps) {
  const { data, isLoading, error } = useHealthProfile(patientId);
  const updateProfile = useUpdateHealthProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<HealthProfile>>({});
  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newMedication, setNewMedication] = useState("");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-destructive text-center">Failed to load health profile</p>
        </CardContent>
      </Card>
    );
  }

  const profile = data?.profile;

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        patientId,
        data: editedProfile,
      });
      toast.success("Health profile updated");
      setIsEditing(false);
      setEditedProfile({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const startEditing = () => {
    setEditedProfile({
      bloodType: profile?.bloodType,
      height: profile?.height,
      weight: profile?.weight,
      dateOfBirth: profile?.dateOfBirth,
      allergies: profile?.allergies || [],
      chronicConditions: profile?.chronicConditions || [],
      currentMedications: profile?.currentMedications || [],
      smokingStatus: profile?.smokingStatus,
      alcoholUse: profile?.alcoholUse,
      exerciseFrequency: profile?.exerciseFrequency,
      emergencyContactName: profile?.emergencyContactName,
      emergencyContactPhone: profile?.emergencyContactPhone,
      emergencyContactRelation: profile?.emergencyContactRelation,
    });
    setIsEditing(true);
  };

  const addToList = (field: "allergies" | "chronicConditions" | "currentMedications", value: string) => {
    if (!value.trim()) return;
    const currentList = editedProfile[field] || [];
    setEditedProfile({
      ...editedProfile,
      [field]: [...currentList, value.trim()],
    });
  };

  const removeFromList = (field: "allergies" | "chronicConditions" | "currentMedications", index: number) => {
    const currentList = editedProfile[field] || [];
    setEditedProfile({
      ...editedProfile,
      [field]: currentList.filter((_, i) => i !== index),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Health Profile
          </CardTitle>
          <CardDescription>Your personal health information</CardDescription>
        </div>
        {!readonly && !isEditing && (
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
              <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
              <TabsTrigger value="emergency">Emergency</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Blood Type</Label>
                  <Select
                    value={editedProfile.bloodType || ""}
                    onValueChange={(v) => setEditedProfile({ ...editedProfile, bloodType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={editedProfile.dateOfBirth?.split("T")[0] || ""}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        dateOfBirth: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    placeholder="175"
                    value={editedProfile.height || ""}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        height: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    placeholder="70"
                    value={editedProfile.weight || ""}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        weight: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conditions" className="space-y-4 mt-4">
              {/* Allergies */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Allergies
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add allergy..."
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addToList("allergies", newAllergy);
                        setNewAllergy("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={() => {
                      addToList("allergies", newAllergy);
                      setNewAllergy("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editedProfile.allergies || []).map((allergy, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                      {allergy}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFromList("allergies", i)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Chronic Conditions */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Chronic Conditions
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add condition..."
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addToList("chronicConditions", newCondition);
                        setNewCondition("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={() => {
                      addToList("chronicConditions", newCondition);
                      setNewCondition("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editedProfile.chronicConditions || []).map((condition, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                      {condition}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFromList("chronicConditions", i)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Current Medications */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-blue-500" />
                  Current Medications
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add medication..."
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addToList("currentMedications", newMedication);
                        setNewMedication("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={() => {
                      addToList("currentMedications", newMedication);
                      setNewMedication("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editedProfile.currentMedications || []).map((med, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                      {med}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFromList("currentMedications", i)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lifestyle" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Cigarette className="h-4 w-4" />
                    Smoking Status
                  </Label>
                  <Select
                    value={editedProfile.smokingStatus || ""}
                    onValueChange={(v) => setEditedProfile({ ...editedProfile, smokingStatus: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="former">Former</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Wine className="h-4 w-4" />
                    Alcohol Use
                  </Label>
                  <Select
                    value={editedProfile.alcoholUse || ""}
                    onValueChange={(v) => setEditedProfile({ ...editedProfile, alcoholUse: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="occasional">Occasional</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" />
                    Exercise
                  </Label>
                  <Select
                    value={editedProfile.exerciseFrequency || ""}
                    onValueChange={(v) => setEditedProfile({ ...editedProfile, exerciseFrequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="rarely">Rarely</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="frequent">Frequent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="emergency" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={editedProfile.emergencyContactName || ""}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, emergencyContactName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="+1 234 567 8900"
                    value={editedProfile.emergencyContactPhone || ""}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, emergencyContactPhone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Input
                    placeholder="Spouse, Parent, etc."
                    value={editedProfile.emergencyContactRelation || ""}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, emergencyContactRelation: e.target.value })
                    }
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blood Type</p>
                  <p className="font-medium">{profile?.bloodType || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Ruler className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="font-medium">
                    {profile?.height ? `${profile.height} cm` : "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Scale className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="font-medium">
                    {profile?.weight ? `${profile.weight} kg` : "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {profile?.dateOfBirth
                      ? new Date(profile.dateOfBirth).toLocaleDateString()
                      : "Not set"}
                  </p>
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-4">
              {profile?.allergies && profile.allergies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Allergies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies.map((allergy, i) => (
                      <Badge key={i} variant="destructive">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile?.chronicConditions && profile.chronicConditions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    Chronic Conditions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.chronicConditions.map((condition, i) => (
                      <Badge key={i} variant="secondary">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile?.currentMedications && profile.currentMedications.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Pill className="h-4 w-4 text-blue-500" />
                    Current Medications
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.currentMedications.map((med, i) => (
                      <Badge key={i} variant="outline">
                        {med}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Emergency Contact */}
            {profile?.emergencyContactName && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-500" />
                  Emergency Contact
                </h4>
                <p className="text-sm">
                  {profile.emergencyContactName}
                  {profile.emergencyContactRelation && ` (${profile.emergencyContactRelation})`}
                  {profile.emergencyContactPhone && ` - ${profile.emergencyContactPhone}`}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
