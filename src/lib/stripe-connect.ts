import { stripe } from "./stripe";

/**
 * Create a Stripe Connect account for a doctor
 * This initiates the onboarding process
 */
export async function createStripeConnectAccount(doctorEmail: string, doctorName: string) {
  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: "US", // Default, can be made configurable
      email: doctorEmail,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        doctorName: doctorName,
      },
    });

    return account;
  } catch (error) {
    console.error("Error creating Stripe Connect account:", error);
    throw new Error("Failed to create Stripe Connect account");
  }
}

/**
 * Create an onboarding link for a Stripe Connect account
 * Doctors use this link to complete their account setup
 */
export async function createOnboardingLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return accountLink;
  } catch (error) {
    console.error("Error creating onboarding link:", error);
    throw new Error("Failed to create onboarding link");
  }
}

/**
 * Get the status of a Stripe Connect account
 */
export async function getAccountStatus(accountId: string) {
  try {
    const account = await stripe.accounts.retrieve(accountId);

    return {
      id: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      email: account.email,
      country: account.country,
    };
  } catch (error) {
    console.error("Error retrieving account status:", error);
    throw new Error("Failed to retrieve account status");
  }
}

/**
 * Check if a Stripe Connect account is ready to receive payouts
 */
export async function isAccountReady(accountId: string): Promise<boolean> {
  try {
    const status = await getAccountStatus(accountId);
    return status.chargesEnabled && status.payoutsEnabled && status.detailsSubmitted;
  } catch (error) {
    return false;
  }
}

/**
 * Create a login link for Express Dashboard
 * Allows doctors to access their Stripe account dashboard
 */
export async function createExpressDashboardLink(
  accountId: string,
  returnUrl: string
) {
  try {
    const loginLink = await stripe.accounts.createLoginLink(accountId);

    return loginLink;
  } catch (error) {
    console.error("Error creating Express Dashboard link:", error);
    throw new Error("Failed to create Express Dashboard link");
  }
}

