"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Percent, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

function PaymentSettingsClient() {
  const queryClient = useQueryClient();
  const [commissionPercentage, setCommissionPercentage] = useState<number>(3.0);

  // Fetch current commission settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["commission-settings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/settings/commission");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch commission settings" }));
        const errorMessage = errorData.error || errorData.message || "Failed to fetch commission settings";
        throw new Error(errorMessage);
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (settings) {
      setCommissionPercentage(settings.commissionPercentage);
    }
  }, [settings]);

  // Update commission mutation
  const updateMutation = useMutation({
    mutationFn: async (percentage: number) => {
      const response = await fetch("/api/admin/settings/commission", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionPercentage: percentage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || "Failed to update commission";
        // Format validation errors if present
        if (errorData.details && errorData.details.length > 0) {
          const detailMessages = errorData.details.map((d: { field: string; message: string }) => d.message).join(", ");
          throw new Error(`${errorMessage}. ${detailMessages}`);
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Commission percentage updated successfully");
      queryClient.invalidateQueries({ queryKey: ["commission-settings"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update commission percentage");
    },
  });

  const handleSave = () => {
    if (commissionPercentage < 1 || commissionPercentage > 10) {
      toast.error("Commission percentage must be between 1% and 10%");
      return;
    }

    updateMutation.mutate(commissionPercentage);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment Settings</h1>
        <p className="text-muted-foreground">
          Configure platform commission and payment settings
        </p>
      </div>

      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Commission Settings
            </CardTitle>
            <CardDescription>
              Set the platform commission percentage charged per appointment booking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="commission">Commission Percentage</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="commission"
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={commissionPercentage}
                  onChange={(e) => setCommissionPercentage(parseFloat(e.target.value) || 0)}
                  className="max-w-[200px]"
                />
                <span className="text-2xl font-semibold">%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Current commission: {settings?.commissionPercentage || 3}%
                {settings?.updatedAt && (
                  <span className="ml-2">
                    (Last updated: {new Date(settings.updatedAt).toLocaleDateString()})
                  </span>
                )}
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Commission Examples:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• $50 appointment: ${((50 * commissionPercentage) / 100).toFixed(2)} commission</li>
                <li>• $100 appointment: ${((100 * commissionPercentage) / 100).toFixed(2)} commission</li>
                <li>• $200 appointment: ${((200 * commissionPercentage) / 100).toFixed(2)} commission</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}

export default PaymentSettingsClient;

