import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createStripeConnectAccount, createOnboardingLink } from "@/lib/stripe-connect";
import { requireAuth } from "@/lib/server/rbac";

/**
 * POST /api/doctors/[id]/payment-setup
 * Create Stripe Connect account and onboarding link for doctor
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    if (context.role === "doctor" && context.doctorId !== id) {
      return NextResponse.json(
        { error: "Forbidden - Can only set up your own payment account" },
        { status: 403 }
      );
    }

    if (context.role !== "doctor" && context.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get doctor
    const doctor = await prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    // Check if payment account already exists
    const existingAccount = await prisma.doctorPaymentAccount.findUnique({
      where: { doctorId: id },
    });

    if (existingAccount) {
      // If account exists but onboarding not completed, create new link
      if (!existingAccount.onboardingCompleted) {
        const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/doctor/settings/payments?return=true`;
        const refreshUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/doctor/settings/payments?refresh=true`;

        const accountLink = await createOnboardingLink(
          existingAccount.stripeAccountId,
          returnUrl,
          refreshUrl
        );

        await prisma.doctorPaymentAccount.update({
          where: { id: existingAccount.id },
          data: {
            onboardingLink: accountLink.url,
            onboardingLinkExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
        });

        return NextResponse.json({
          onboardingUrl: accountLink.url,
          accountId: existingAccount.stripeAccountId,
        });
      }

      return NextResponse.json(
        { error: "Payment account already set up" },
        { status: 400 }
      );
    }

    // Create new Stripe Connect account
    const stripeAccount = await createStripeConnectAccount(doctor.email, doctor.name);

    // Create onboarding link
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/doctor/settings/payments?return=true`;
    const refreshUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/doctor/settings/payments?refresh=true`;

    const accountLink = await createOnboardingLink(
      stripeAccount.id,
      returnUrl,
      refreshUrl
    );

    // Save to database
    await prisma.doctorPaymentAccount.create({
      data: {
        doctorId: id,
        stripeAccountId: stripeAccount.id,
        onboardingLink: accountLink.url,
        onboardingLinkExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        email: doctor.email,
        accountStatus: "PENDING",
      },
    });

    return NextResponse.json({
      onboardingUrl: accountLink.url,
      accountId: stripeAccount.id,
    });
  } catch (error) {
    console.error("Error setting up payment account:", error);
    return NextResponse.json(
      { error: "Failed to set up payment account" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/doctors/[id]/payment-setup
 * Get payment account status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    if (context.role === "doctor" && context.doctorId !== id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const account = await prisma.doctorPaymentAccount.findUnique({
      where: { doctorId: id },
    });

    if (!account) {
      return NextResponse.json({
        exists: false,
      });
    }

    return NextResponse.json({
      exists: true,
      accountStatus: account.accountStatus,
      onboardingCompleted: account.onboardingCompleted,
      payoutEnabled: account.payoutEnabled,
      stripeAccountId: account.stripeAccountId,
    });
  } catch (error) {
    console.error("Error getting payment account:", error);
    return NextResponse.json(
      { error: "Failed to get payment account" },
      { status: 500 }
    );
  }
}

