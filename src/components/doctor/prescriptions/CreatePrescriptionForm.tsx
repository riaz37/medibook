"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPrescriptionSchema, type CreatePrescriptionInput } from "@/lib/validations/prescription.schema";
import { useCreatePrescription, useSearchMedications } from "@/hooks/use-prescription";
import { Plus, X, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import type { MedicationSearchResult } from "@/lib/types/prescription";

interface CreatePrescriptionFormProps {
  appointmentId?: string;
  patientId?: string;
  onSuccess?: () => void;
}

export function CreatePrescriptionForm({
  appointmentId,
  patientId: initialPatientId,
  onSuccess,
}: CreatePrescriptionFormProps) {
  const router = useRouter();
  const [medicationSearchResults, setMedicationSearchResults] = useState<MedicationSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMedicationIndex, setSelectedMedicationIndex] = useState<number | null>(null);

  const createPrescription = useCreatePrescription();
  const searchMedications = useSearchMedications();

  const form = useForm<CreatePrescriptionInput>({
    resolver: zodResolver(createPrescriptionSchema) as any,
    defaultValues: {
      appointmentId: appointmentId || null,
      patientId: initialPatientId || "",
      items: [
        {
          medicationId: null,
          medicationName: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: null,
          quantity: null,
          refillsAllowed: 0,
        },
      ],
      expiryDate: null,
      notes: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const searchQuery = form.watch(`items.${selectedMedicationIndex ?? 0}.medicationName`);
  const debouncedSearch = useDebounce(searchQuery || "", 500);

  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length >= 2 && selectedMedicationIndex !== null) {
      handleMedicationSearch(debouncedSearch);
    } else {
      setMedicationSearchResults([]);
    }
  }, [debouncedSearch, selectedMedicationIndex]);

  const handleMedicationSearch = async (query: string) => {
    if (query.length < 2) return;

    setSearching(true);
    try {
      const result = await searchMedications.mutateAsync({
        query,
        limit: 10,
      });
      setMedicationSearchResults(result.medications);
    } catch (error) {
      console.error("Error searching medications:", error);
      setMedicationSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectMedication = (medication: MedicationSearchResult, index: number) => {
    form.setValue(`items.${index}.medicationId`, medication.id);
    form.setValue(`items.${index}.medicationName`, medication.name);
    setMedicationSearchResults([]);
    setSelectedMedicationIndex(null);
  };

  const onSubmit = async (data: CreatePrescriptionInput) => {
    try {
      await createPrescription.mutateAsync(data);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/doctor/prescriptions");
      }
    } catch (error) {
      console.error("Error creating prescription:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Prescription</CardTitle>
            <CardDescription>Add medications and instructions for the patient</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control as any}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient ID</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!!initialPatientId} />
                  </FormControl>
                  <FormDescription>
                    {initialPatientId ? "Patient ID is pre-filled from appointment" : "Enter patient ID"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Medications</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      medicationId: null,
                      medicationName: "",
                      dosage: "",
                      frequency: "",
                      duration: "",
                      instructions: null,
                      quantity: null,
                      refillsAllowed: 0,
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Medication {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="relative">
                      <FormField
                        control={form.control as any}
                        name={`items.${index}.medicationName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medication Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                  {...field}
                                  placeholder="Search medication..."
                                  className="pl-10"
                                  onFocus={() => setSelectedMedicationIndex(index)}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (e.target.value.length >= 2) {
                                      setSelectedMedicationIndex(index);
                                    }
                                  }}
                                />
                                {searching && selectedMedicationIndex === index && (
                                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {medicationSearchResults.length > 0 && selectedMedicationIndex === index && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                          {medicationSearchResults.map((medication) => (
                            <button
                              key={medication.id}
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-muted transition-colors"
                              onClick={() => selectMedication(medication, index)}
                            >
                              <div className="font-medium">{medication.name}</div>
                              {medication.genericName && (
                                <div className="text-sm text-muted-foreground">
                                  {medication.genericName}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control as any}
                        name={`items.${index}.dosage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dosage</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., 500mg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control as any}
                        name={`items.${index}.frequency`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequency</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Twice daily" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control as any}
                        name={`items.${index}.duration`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., 7 days" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control as any}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="Number of units"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control as any}
                      name={`items.${index}.refillsAllowed`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Refills Allowed</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              min={0}
                              max={12}
                            />
                          </FormControl>
                          <FormDescription>Number of refills allowed (0-12)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name={`items.${index}.instructions`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Instructions</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              placeholder="e.g., Take with food, Avoid alcohol"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control as any}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Additional notes for the prescription"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPrescription.isPending}>
                {createPrescription.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Prescription"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}

