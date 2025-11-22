/**
 * Shared Verification Types
 * Used across hooks and components for doctor verification
 */

/**
 * Base doctor verification structure
 */
export interface DoctorVerification {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  licenseUrl: string | null;
  certificateUrl: string | null;
  idDocumentUrl: string | null;
  otherDocuments: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
}

/**
 * Verification with doctor information (used in admin views)
 */
export interface VerificationWithDoctor {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  licenseUrl: string | null;
  certificateUrl: string | null;
  idDocumentUrl: string | null;
  otherDocuments: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  doctor: {
    id: string;
    name: string;
    email: string;
    speciality: string;
    imageUrl: string;
    createdAt: Date;
  };
}

/**
 * Verification status filter type
 */
export type VerificationStatus = "all" | "PENDING" | "APPROVED" | "REJECTED";

