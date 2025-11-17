/**
 * Shared Verification Types
 * Used across hooks and components for doctor verification
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

