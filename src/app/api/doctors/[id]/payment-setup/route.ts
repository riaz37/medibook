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

    // Get doctor first to check verification status
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        userId: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    // Admin can set up payment for any doctor
    if (context.role === "admin") {
      // Admin access granted, continue
    }
    // For doctors: allow both "doctor" and "doctor_pending" roles if doctor profile is verified
    else if (context.role === "doctor" || context.role === "doctor_pending") {
      // Check if doctor is setting up their own account
      // Match by doctorId OR by userId (in case doctorId is null)
      const isOwnAccount = context.doctorId === id || doctor.userId === context.userId;
      
      if (!isOwnAccount) {
        console.log("[Payment Setup] Access denied: Not own account", {
          contextDoctorId: context.doctorId,
          requestedId: id,
          doctorUserId: doctor.userId,
          contextUserId: context.userId,
        });
        return NextResponse.json(
          { error: "Forbidden - Can only set up your own payment account" },
          { status: 403 }
        );
      }
      
      // Check if doctor profile is actually verified
      if (!doctor.isVerified) {
        console.log("[Payment Setup] Access denied: Doctor not verified", {
          doctorId: id,
          isVerified: doctor.isVerified,
        });
        return NextResponse.json(
          { error: "Doctor must be verified before setting up payment account" },
          { status: 403 }
        );
      }
    }
    // Reject patient or any other role
    else {
      console.log("[Payment Setup] Access denied: Invalid role", {
        role: context.role,
      });
      return NextResponse.json(
        { error: "Only verified doctors can set up payment accounts" },
        { status: 403 }
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

