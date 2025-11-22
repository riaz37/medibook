import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { doctorVerificationSchema } from "@/lib/validations";
import { validateRequest } from "@/lib/utils/validation";

/**
 * GET /api/doctors/[id]/verification - Get verification status
 * Accessible by: the doctor themselves or admin users
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;
    
    // Middleware ensures user is authenticated and has doctor/admin role
    const { getAuthContext } = await import("@/lib/server/auth-utils");
    const context = await getAuthContext();
    
    if (!context || (context.role !== "admin" && context.doctorId !== id)) {
      return NextResponse.json(
        { error: "Forbidden: You can only access your own verification" },
        { status: 403 }
      );
    }

    const verification = await prisma.doctorVerification.findUnique({
      where: { doctorId: id },
    });

    return NextResponse.json(verification || null);
  } catch (error) {
    console.error("Error fetching verification:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/doctors/[id]/verification - Submit documents for verification (doctor only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;
    
    // Middleware ensures user is authenticated and has doctor/admin role
    const { getAuthContext } = await import("@/lib/server/auth-utils");
    const context = await getAuthContext();
    
    if (!context || (context.role !== "admin" && context.doctorId !== id)) {
      return NextResponse.json(
        { error: "Forbidden: You can only submit verification for your own profile" },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate request body
    const validation = validateRequest(doctorVerificationSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { licenseUrl, certificateUrl, idDocumentUrl, otherDocuments } = validation.data;

    // Create or update verification
    const verification = await prisma.doctorVerification.upsert({
      where: { doctorId: id },
      create: {
        doctorId: id,
        licenseUrl,
        certificateUrl: certificateUrl || null,
        idDocumentUrl: idDocumentUrl || null,
        otherDocuments: otherDocuments ? JSON.stringify(otherDocuments) : null,
        status: "PENDING",
        submittedAt: new Date(),
      },
      update: {
        licenseUrl,
        certificateUrl: certificateUrl || null,
        idDocumentUrl: idDocumentUrl || null,
        otherDocuments: otherDocuments ? JSON.stringify(otherDocuments) : null,
        status: "PENDING",
        submittedAt: new Date(),
        rejectionReason: null, // Clear previous rejection reason
      },
    });

    return NextResponse.json(verification);
  } catch (error) {
    console.error("Error submitting verification:", error);
    return NextResponse.json(
      { error: "Failed to submit verification documents" },
      { status: 500 }
    );
  }
}

