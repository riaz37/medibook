"use client";

import { useState, useEffect } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2 } from "lucide-react";

// Initialize Stripe
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
}

const stripePromise = loadStripe(stripePublishableKey);
import type { PaymentCheckoutProps } from "@/lib/types";

function PaymentForm({
  appointmentId,
  appointmentPrice,
  doctorId,
  doctorName,
  onSuccess,
  onError,
}: PaymentCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create payment intent on mount
  useEffect(() => {
    const createIntent = async () => {
      try {
        const response = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId,
            appointmentPrice,
            doctorId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to create payment intent");
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to initialize payment";
        setError(errorMessage);
        onError(errorMessage);
      }
    };

    createIntent();
  }, [appointmentId, appointmentPrice, doctorId, onError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Card element not found");
      setIsProcessing(false);
      return;
    }

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || "Payment failed");
        onError(stripeError.message || "Payment failed");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        // Immediately confirm payment in database (don't wait for webhook)
        if (paymentIntentId && appointmentId) {
          try {
            const confirmResponse = await fetch("/api/payments/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                appointmentId,
              }),
            });

            if (!confirmResponse.ok) {
              // Log error but don't block success - webhook will handle it
              console.error("Failed to confirm payment immediately, webhook will handle it");
            }
          } catch (confirmError) {
            // Log error but don't block success - webhook will handle it
            console.error("Error confirming payment:", confirmError);
          }
        }
        
        onSuccess();
      } else {
        setError("Payment was not completed");
        onError("Payment was not completed");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Payment failed";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get computed styles for theme-aware colors
  const getCardElementOptions = () => {
    // Check if dark mode is active (only on client side)
    const isDark = typeof window !== "undefined" && (
      window.matchMedia("(prefers-color-scheme: dark)").matches ||
      document.documentElement.classList.contains("dark")
    );
    
    return {
      style: {
        base: {
          fontSize: "16px",
          color: isDark ? "#ffffff" : "#1f2937", // White in dark mode, dark grey in light mode
          fontFamily: "system-ui, sans-serif",
          "::placeholder": {
            color: isDark ? "#9ca3af" : "#6b7280", // Lighter grey for placeholders
          },
        },
        invalid: {
          color: "#ef4444", // Red for invalid input
          iconColor: "#ef4444",
        },
      },
    };
  };

  const cardElementOptions = getCardElementOptions();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block text-foreground">Card Details</label>
        <div className="border rounded-lg p-4 bg-background">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="text-2xl font-bold">${appointmentPrice.toFixed(2)}</p>
        </div>
        <Button
          type="submit"
          disabled={!stripe || !elements || isProcessing || !clientSecret}
          className="min-w-[120px]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ${appointmentPrice.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function PaymentCheckout(props: PaymentCheckoutProps) {
  // Detect theme for Stripe Elements appearance
  const isDark = typeof window !== "undefined" && (
    window.matchMedia("(prefers-color-scheme: dark)").matches ||
    document.documentElement.classList.contains("dark")
  );

  const options: StripeElementsOptions = {
    appearance: {
      theme: isDark ? "night" : "stripe",
      variables: {
        colorPrimary: "hsl(var(--primary))",
        colorBackground: isDark ? "hsl(var(--background))" : "#ffffff",
        colorText: isDark ? "#ffffff" : "#1f2937",
        colorDanger: "#ef4444",
        fontFamily: "system-ui, sans-serif",
        spacingUnit: "4px",
        borderRadius: "8px",
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <CardDescription>
          Complete your payment to confirm your appointment with {props.doctorName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={options}>
          <PaymentForm {...props} />
        </Elements>
      </CardContent>
    </Card>
  );
}

