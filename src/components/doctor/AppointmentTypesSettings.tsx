"use client";

import { useState, useEffect } from "react";
import { useDoctorSettingsStore } from "@/lib/stores/doctor-settings.store";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, Stethoscope } from "lucide-react";
import { useDoctorConfig, useCreateDoctorAppointmentType, useUpdateDoctorAppointmentType, useDeleteDoctorAppointmentType } from "@/hooks";
import { showSuccess, showError, handleApiError, toastMessages } from "@/lib/utils/toast";
import { CommissionPreview } from "./CommissionPreview";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { AppointmentTypesSettingsProps } from "@/lib/types";

export default function AppointmentTypesSettings({ doctorId, open, onOpenChange }: AppointmentTypesSettingsProps) {
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [editingAppointmentType, setEditingAppointmentType] = useState<any>(null);
  const [newAppointmentType, setNewAppointmentType] = useState({
    name: "",
    duration: 30,
    description: "",
    price: "",
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [appointmentTypeToDelete, setAppointmentTypeToDelete] = useState<any>(null);

  const {
    appointmentTypes,
    setAppointmentTypes,
    addAppointmentType,
    updateAppointmentType,
    removeAppointmentType,
    initializeFromConfig,
    isLoading: storeLoading,
  } = useDoctorSettingsStore();

  const { data: config, isLoading: queryLoading } = useDoctorConfig(open ? doctorId : null);

  useEffect(() => {
    if (config && open) {
      initializeFromConfig({
        availability: {
          timeSlots: [],
          slotDuration: 30,
          bookingAdvanceDays: 30,
          minBookingHours: 24,
        },
        workingHours: [],
        appointmentTypes: config.appointmentTypes || [],
      });
    }
  }, [config, open, initializeFromConfig]);

  const createAppointmentTypeMutation = useCreateDoctorAppointmentType();
  const updateAppointmentTypeMutation = useUpdateDoctorAppointmentType();
  const deleteAppointmentTypeMutation = useDeleteDoctorAppointmentType();

  const handleCreateAppointmentType = () => {
    if (!newAppointmentType.name || !newAppointmentType.duration) {
      showError(toastMessages.error.validationError);
      return;
    }
    createAppointmentTypeMutation.mutate(
      {
        doctorId,
        data: {
          name: newAppointmentType.name,
          duration: newAppointmentType.duration,
          description: newAppointmentType.description?.trim() || undefined,
          price: newAppointmentType.price ? parseFloat(newAppointmentType.price) : undefined,
        },
      },
      {
        onSuccess: (data: any) => {
          showSuccess("Appointment type created successfully");
          addAppointmentType(data);
          setIsAppointmentDialogOpen(false);
          setNewAppointmentType({ name: "", duration: 30, description: "", price: "" });
        },
        onError: (error: Error) => {
          const errorMessage = handleApiError(error, "Failed to create appointment type");
          showError(errorMessage);
        },
      }
    );
  };

  const handleUpdateAppointmentType = () => {
    if (!editingAppointmentType) return;
    updateAppointmentTypeMutation.mutate(
      {
        doctorId,
        typeId: editingAppointmentType.id,
        data: {
          name: editingAppointmentType.name,
          duration: editingAppointmentType.duration,
          description: editingAppointmentType.description?.trim() || undefined,
          price: editingAppointmentType.price ? parseFloat(editingAppointmentType.price) : undefined,
          isActive: editingAppointmentType.isActive,
        },
      },
      {
        onSuccess: (data: any) => {
          showSuccess("Appointment type updated successfully");
          updateAppointmentType(data.id, data);
          setIsAppointmentDialogOpen(false);
          setEditingAppointmentType(null);
        },
        onError: (error: Error) => {
          const errorMessage = handleApiError(error, "Failed to update appointment type");
          showError(errorMessage);
        },
      }
    );
  };

  if (queryLoading || storeLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Appointment Types</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Appointment Types
            </DialogTitle>
            <DialogDescription>
              Manage the types of appointments you offer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsAppointmentDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Type
              </Button>
            </div>

            {appointmentTypes.length === 0 ? (
              <div className="text-center py-8">
                <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No appointment types yet</p>
                <Button
                  onClick={() => setIsAppointmentDialogOpen(true)}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Type
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointmentTypes.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{type.name}</h3>
                        {!type.isActive && (
                          <span className="text-xs text-muted-foreground">(Inactive)</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {type.duration} minutes
                        {type.price && ` • $${type.price}`}
                      </p>
                      {type.description && (
                        <p className="text-sm mt-1">{type.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingAppointmentType({
                            ...type,
                            price: type.price?.toString() || "",
                          });
                          setIsAppointmentDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setAppointmentTypeToDelete(type);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Type Dialog */}
      <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAppointmentType ? "Edit Appointment Type" : "Create Appointment Type"}
            </DialogTitle>
            <DialogDescription>
              {editingAppointmentType
                ? "Update the appointment type details"
                : "Add a new type of appointment you offer"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="typeName">Name *</Label>
              <Input
                id="typeName"
                value={editingAppointmentType?.name || newAppointmentType.name}
                onChange={(e) => {
                  if (editingAppointmentType) {
                    setEditingAppointmentType({ ...editingAppointmentType, name: e.target.value });
                  } else {
                    setNewAppointmentType({ ...newAppointmentType, name: e.target.value });
                  }
                }}
                placeholder="e.g., Regular Checkup"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="typeDuration">Duration (minutes) *</Label>
                <Input
                  id="typeDuration"
                  type="number"
                  min="15"
                  max="240"
                  step="15"
                  value={editingAppointmentType?.duration || newAppointmentType.duration}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 30;
                    if (editingAppointmentType) {
                      setEditingAppointmentType({ ...editingAppointmentType, duration: value });
                    } else {
                      setNewAppointmentType({ ...newAppointmentType, duration: value });
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="typePrice">Price (optional)</Label>
                <Input
                  id="typePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingAppointmentType?.price || newAppointmentType.price}
                  onChange={(e) => {
                    if (editingAppointmentType) {
                      setEditingAppointmentType({ ...editingAppointmentType, price: e.target.value });
                    } else {
                      setNewAppointmentType({ ...newAppointmentType, price: e.target.value });
                    }
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>
            {/* Commission Preview */}
            {(editingAppointmentType?.price || newAppointmentType.price) && (
              <CommissionPreview
                appointmentPrice={
                  editingAppointmentType?.price
                    ? parseFloat(editingAppointmentType.price) || null
                    : newAppointmentType.price
                    ? parseFloat(newAppointmentType.price) || null
                    : null
                }
                className="mt-4"
              />
            )}
            <div>
              <Label htmlFor="typeDescription">Description</Label>
              <Textarea
                id="typeDescription"
                value={editingAppointmentType?.description || newAppointmentType.description}
                onChange={(e) => {
                  if (editingAppointmentType) {
                    setEditingAppointmentType({ ...editingAppointmentType, description: e.target.value });
                  } else {
                    setNewAppointmentType({ ...newAppointmentType, description: e.target.value });
                  }
                }}
                placeholder="Describe this appointment type..."
                rows={3}
              />
            </div>
            {editingAppointmentType && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingAppointmentType.isActive}
                  onCheckedChange={(checked) => {
                    setEditingAppointmentType({ ...editingAppointmentType, isActive: checked });
                  }}
                />
                <Label>Active (visible to patients)</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAppointmentDialogOpen(false);
                setEditingAppointmentType(null);
                setNewAppointmentType({ name: "", duration: 30, description: "", price: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingAppointmentType ? handleUpdateAppointmentType : handleCreateAppointmentType}
              disabled={
                createAppointmentTypeMutation.isPending ||
                updateAppointmentTypeMutation.isPending
              }
            >
              {editingAppointmentType ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Appointment Type"
        description="Are you sure you want to delete this appointment type? This action cannot be undone."
        warningText={
          appointmentTypeToDelete
            ? "If this appointment type is used in existing appointments, those appointments will remain but the type details may be lost."
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (appointmentTypeToDelete) {
            deleteAppointmentTypeMutation.mutate(
              { doctorId, typeId: appointmentTypeToDelete.id },
              {
                onSuccess: () => {
                  showSuccess("Appointment type deleted successfully");
                  removeAppointmentType(appointmentTypeToDelete.id);
                  setAppointmentTypeToDelete(null);
                },
                onError: (error: Error) => {
                  const errorMessage = handleApiError(error, "Failed to delete appointment type");
                  showError(errorMessage);
                },
              }
            );
          }
        }}
      />
    </>
  );
}

