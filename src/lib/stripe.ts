import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

/**
 * Server-side Stripe instance
 * Use this for server-side operations (API routes, server components)
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
  typescript: true,
});

/**
 * Get Stripe publishable key for client-side
 */
export function getStripePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables");
  }
  return key;
}

