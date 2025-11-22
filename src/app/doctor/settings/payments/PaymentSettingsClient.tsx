"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { showSuccess, showError } from "@/lib/utils/toast";
import { useRouter, useSearchParams } from "next/navigation";
import type { PaymentSettingsClientProps } from "@/lib/types";

function PaymentSettingsClient({ doctorId }: PaymentSettingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Check if returning from Stripe onboarding
  useEffect(() => {
    if (searchParams.get("return") === "true") {
      showSuccess("Payment account setup completed! Please wait while we verify your account.");
      queryClient.invalidateQueries({ queryKey: ["payment-account", doctorId] });
    }
  }, [searchParams, queryClient, doctorId]);

  // Fetch payment account status
  const { data: accountStatus, isLoading } = useQuery({
    queryKey: ["payment-account", doctorId],
    queryFn: async () => {
      const response = await fetch(`/api/doctors/${doctorId}/payment-setup`);
      if (!response.ok) {
        throw new Error("Failed to fetch payment account status");
      }
      return response.json();
    },
  });

  // Setup payment account mutation
  const setupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/doctors/${doctorId}/payment-setup`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to set up payment account");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe onboarding
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to set up payment account");
      setIsSettingUp(false);
    },
  });

  const handleSetup = () => {
    setIsSettingUp(true);
    setupMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const accountExists = accountStatus?.exists;
  const isActive = accountStatus?.accountStatus === "ACTIVE";
  const isPending = accountStatus?.accountStatus === "PENDING";
  const onboardingCompleted = accountStatus?.onboardingCompleted;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Settings</h1>
          <p className="text-muted-foreground mt-2">
            Set up your payment account to receive payouts from appointments
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Stripe Connect Account
            </CardTitle>
            <CardDescription>
              Connect your bank account to receive payments from appointments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!accountExists ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You need to set up a payment account to receive payouts. This is a one-time setup
                  process that takes just a few minutes.
                </p>
                <Button
                  onClick={handleSetup}
                  disabled={isSettingUp || setupMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {isSettingUp || setupMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Set Up Payment Account
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {isActive && onboardingCompleted ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Account Active</p>
                        <p className="text-sm text-muted-foreground">
                          Your payment account is set up and ready to receive payouts
                        </p>
                      </div>
                    </>
                  ) : isPending ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">Account Pending</p>
                        <p className="text-sm text-muted-foreground">
                          Your account is being verified. This usually takes 1-2 business days.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium">Account Setup Required</p>
                        <p className="text-sm text-muted-foreground">
                          Please complete the onboarding process
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {!onboardingCompleted && (
                  <Button
                    onClick={handleSetup}
                    disabled={isSettingUp || setupMutation.isPending}
                    variant="outline"
                  >
                    {isSettingUp || setupMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Complete Setup
                      </>
                    )}
                  </Button>
                )}

                {isActive && (
                  <div className="pt-4 border-t space-y-2">
                    <p className="text-sm font-medium">Account Details</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Account ID: {accountStatus.stripeAccountId}</p>
                      <p>Status: {accountStatus.accountStatus}</p>
                      <p>Payouts: {accountStatus.payoutEnabled ? "Enabled" : "Disabled"}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout Information */}
        <Card>
          <CardHeader>
            <CardTitle>Payout Information</CardTitle>
            <CardDescription>
              How you'll receive payments from appointments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <p className="font-medium">Payout Schedule</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Payouts are automatically processed 2 hours after each appointment</li>
                <li>Funds are transferred directly to your connected bank account</li>
                <li>Platform commission (3%) is deducted before payout</li>
                <li>You receive the remaining amount (appointment price - commission)</li>
              </ul>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Example:</p>
              <p className="text-sm text-muted-foreground">
                If a patient pays $100 for an appointment:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Platform commission: $3 (3%)</li>
                <li>• Your payout: $97</li>
                <li>• Payout processed: 2 hours after appointment time</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PaymentSettingsClient;

