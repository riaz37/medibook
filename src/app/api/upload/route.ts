import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { requireAuth } from "@/lib/server/rbac";

/**
 * POST /api/upload - Upload a file to Cloudinary
 * Supports: images, PDFs, and other document types
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Allowed types: images, PDF, DOC, DOCX" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine folder based on context or use provided folder
    let uploadFolder = folder || "medibook";
    
    // Auto-detect folder based on user role
    if (!folder) {
      if (context.role === "doctor") {
        uploadFolder = "doctor-verifications";
      } else if (context.role === "admin") {
        uploadFolder = "admin-uploads";
      } else {
        uploadFolder = "user-uploads";
      }
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      buffer,
      uploadFolder,
      undefined // Let Cloudinary generate public_id
    );

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload file",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload - Delete a file from Cloudinary
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("publicId");
    const url = searchParams.get("url");

    if (!publicId && !url) {
      return NextResponse.json(
        { error: "Either publicId or url is required" },
        { status: 400 }
      );
    }

    const { deleteFromCloudinary, extractPublicIdFromUrl } = await import(
      "@/lib/cloudinary"
    );

    const idToDelete = publicId || extractPublicIdFromUrl(url!);

    if (!idToDelete) {
      return NextResponse.json(
        { error: "Could not extract public ID from URL" },
        { status: 400 }
      );
    }

    await deleteFromCloudinary(idToDelete);

    return NextResponse.json({
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete file",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

