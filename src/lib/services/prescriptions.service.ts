import { BaseService } from "./base.service";
import type {
  CreatePrescriptionInput,
  UpdatePrescriptionInput,
  RequestRefillInput,
  ProcessRefillInput,
  MedicationSearchInput,
} from "@/lib/validations/prescription.schema";
import type {
  PrescriptionWithDetails,
  PrescriptionListItem,
  MedicationSearchResult,
} from "@/lib/types/prescription";

class PrescriptionsService extends BaseService {
  constructor() {
    super();
  }

  // Create prescription
  async create(data: CreatePrescriptionInput): Promise<PrescriptionWithDetails> {
    return this.post("/api/prescriptions", data);
  }

  // Get prescription by ID
  async getById(id: string): Promise<PrescriptionWithDetails> {
    return this.get(`/api/prescriptions/${id}`);
  }

  // Update prescription
  async update(id: string, data: UpdatePrescriptionInput): Promise<PrescriptionWithDetails> {
    return this.put(`/api/prescriptions/${id}`, data);
  }

  // Get doctor's prescriptions
  async getDoctorPrescriptions(params?: {
    status?: string;
    patientId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ prescriptions: PrescriptionWithDetails[]; total: number; limit: number; offset: number }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.patientId) queryParams.append("patientId", params.patientId);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const query = queryParams.toString();
    return this.get(`/api/prescriptions/doctor${query ? `?${query}` : ""}`);
  }

  // Get patient's prescriptions
  async getPatientPrescriptions(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ prescriptions: PrescriptionWithDetails[]; total: number; limit: number; offset: number }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const query = queryParams.toString();
    return this.get(`/api/prescriptions/patient${query ? `?${query}` : ""}`);
  }

  // Request refill
  async requestRefill(
    prescriptionId: string,
    itemId: string,
    data: RequestRefillInput
  ): Promise<unknown> {
    return this.post(`/api/prescriptions/${prescriptionId}/refill/${itemId}/request`, data);
  }

  // Process refill (approve/reject)
  async processRefill(
    prescriptionId: string,
    itemId: string,
    data: ProcessRefillInput
  ): Promise<unknown> {
    return this.post(`/api/prescriptions/${prescriptionId}/refill/${itemId}`, data);
  }

  // Download PDF
  async downloadPDF(id: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/prescriptions/${id}/pdf`, {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to download PDF" }));
      throw new Error(error.error || "Failed to download PDF");
    }

    return response.blob();
  }

  // Search medications
  async searchMedications(params: MedicationSearchInput): Promise<{
    medications: MedicationSearchResult[];
    count: number;
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append("query", params.query);
    if (params.limit) queryParams.append("limit", params.limit.toString());

    return this.get(`/api/medications/search?${queryParams.toString()}`);
  }

  // Get medication by ID
  async getMedication(id: string): Promise<MedicationSearchResult> {
    return this.get(`/api/medications/${id}`);
  }
}

export const prescriptionsService = new PrescriptionsService();

