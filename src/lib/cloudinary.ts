import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

let isConfigured = false;

/**
 * Configure Cloudinary (lazy initialization)
 * 
 * Supports two configuration methods (in order of preference):
 * 1. CLOUDINARY_URL - Single environment variable (recommended)
 *    Format: cloudinary://api_key:api_secret@cloud_name
 * 2. Individual environment variables (fallback)
 *    - CLOUDINARY_CLOUD_NAME
 *    - CLOUDINARY_API_KEY
 *    - CLOUDINARY_API_SECRET
 * 
 * @see https://next.cloudinary.dev/ for Next.js best practices
 * @see https://cloudinary.com/documentation/node_integration#configuration
 */
function configureCloudinary() {
  if (isConfigured) {
    return;
  }

  if (process.env.CLOUDINARY_URL) {
    // Validate CLOUDINARY_URL format
    const url = process.env.CLOUDINARY_URL;
    if (!url.startsWith("cloudinary://")) {
      // During build time, don't throw - just log and skip configuration
      if (process.env.NODE_ENV === "production" || process.env.NEXT_PHASE === "phase-production-build") {
        console.warn(
          "Invalid CLOUDINARY_URL format. URL should begin with 'cloudinary://'. " +
          "Skipping Cloudinary configuration during build."
        );
        return;
      }
      throw new Error(
        `Invalid CLOUDINARY_URL protocol. URL should begin with 'cloudinary://'. ` +
        `Current value starts with: ${url.substring(0, 20)}...`
      );
    }
    // Preferred method: Use CLOUDINARY_URL
    cloudinary.config();
  } else {
    // Fallback: Use individual environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      // During build time, don't throw - just log and skip configuration
      if (process.env.NODE_ENV === "production" || process.env.NEXT_PHASE === "phase-production-build") {
        console.warn(
          "Cloudinary configuration missing. Please set either CLOUDINARY_URL or " +
          "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET. " +
          "Skipping Cloudinary configuration during build."
        );
        return;
      }
      throw new Error(
        "Cloudinary configuration missing. Please set either CLOUDINARY_URL or " +
        "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET"
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  isConfigured = true;
}

export { cloudinary };

/**
 * Upload a file to Cloudinary
 * @param file - File buffer or base64 string
 * @param folder - Folder path in Cloudinary (e.g., "doctor-verifications")
 * @param publicId - Optional public ID for the file
 * @returns Promise with upload result containing secure_url
 */
export async function uploadToCloudinary(
  file: Buffer | string,
  folder: string = "medibook",
  publicId?: string
): Promise<{ secure_url: string; public_id: string }> {
  // Configure Cloudinary lazily (only when actually needed)
  configureCloudinary();
  
  try {
    const uploadOptions: any = {
      folder,
      resource_type: "auto", // Automatically detect image, video, raw, etc.
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    let uploadResult: UploadApiResponse;
    if (Buffer.isBuffer(file)) {
      // Upload from buffer
      uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else if (result) resolve(result);
            else reject(new Error("Upload failed: No result returned"));
          }
        );
        uploadStream.end(file);
      });
    } else {
      // Upload from base64 string
      uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
    }

    if (!uploadResult || !uploadResult.secure_url) {
      throw new Error("Upload failed: No URL returned");
    }

    return {
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(
      error instanceof Error
        ? `Failed to upload file: ${error.message}`
        : "Failed to upload file"
    );
  }
}

/**
 * Delete a file from Cloudinary
 * @param publicId - Public ID of the file to delete
 * @returns Promise with deletion result
 */
export async function deleteFromCloudinary(
  publicId: string
): Promise<{ result: string }> {
  // Configure Cloudinary lazily (only when actually needed)
  configureCloudinary();
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error(
      error instanceof Error
        ? `Failed to delete file: ${error.message}`
        : "Failed to delete file"
    );
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Public ID or null
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|pdf|doc|docx)$/i);
    if (match && match[1]) {
      return match[1];
    }
    // Try alternative pattern
    const altMatch = url.match(/\/image\/upload\/(.+)\.(jpg|jpeg|png|gif|pdf|doc|docx)$/i);
    if (altMatch && altMatch[1]) {
      return altMatch[1].replace(/\//g, ":");
    }
    return null;
  } catch {
    return null;
  }
}

