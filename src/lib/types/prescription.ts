import type {
  Prescription,
  PrescriptionItem,
  PrescriptionRefill,
  Medication,
  PrescriptionAudit,
  PrescriptionStatus,
  RefillStatus,
} from "@/generated/prisma/client";

/**
 * Prescription with related data
 */
export type PrescriptionWithDetails = Prescription & {
  doctor: {
    id: string;
    name: string;
    email: string;
    speciality: string;
    imageUrl: string;
  };
  patient: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  appointment?: {
    id: string;
    date: Date;
    time: string;
    reason: string | null;
  } | null;
  items: PrescriptionItemWithMedication[];
  refills: PrescriptionRefillWithDetails[];
};

/**
 * Prescription Item with medication details
 */
export type PrescriptionItemWithMedication = PrescriptionItem & {
  medication: Medication | null;
  refills: PrescriptionRefill[];
};

/**
 * Prescription Refill with details
 */
export type PrescriptionRefillWithDetails = PrescriptionRefill & {
  prescriptionItem: PrescriptionItemWithMedication;
};

/**
 * Medication search result
 */
export type MedicationSearchResult = {
  id: string;
  name: string;
  genericName: string | null;
  dosageForms: string[];
  strengths: string[];
  description: string | null;
};

/**
 * Prescription list item (summary)
 */
export type PrescriptionListItem = {
  id: string;
  status: PrescriptionStatus;
  issueDate: Date;
  expiryDate: Date | null;
  doctor: {
    id: string;
    name: string;
    speciality: string;
  };
  patient: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  itemCount: number;
  hasPendingRefills: boolean;
};

/**
 * Prescription statistics
 */
export type PrescriptionStats = {
  total: number;
  active: number;
  expired: number;
  completed: number;
  pendingRefills: number;
};

