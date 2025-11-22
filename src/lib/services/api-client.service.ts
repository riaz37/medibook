/**
 * Centralized API Client Service
 * Provides a single point of access for all API calls
 */

import { BaseService } from "./base.service";

class ApiClientService extends BaseService {
  constructor() {
    super();
  }

  // Doctors API
  async getDoctors() {
    return this.get("/api/doctors");
  }

  async getAllDoctorsForAdmin() {
    return this.get("/api/admin/doctors");
  }

  async getAvailableDoctors() {
    return this.get("/api/doctors/available");
  }

  async getDoctorById(id: string) {
    return this.get(`/api/doctors/${id}`);
  }

  async createDoctor(data: {
    name: string;
    email: string;
    phone: string;
    speciality: string;
    gender: string;
  }) {
    return this.post("/api/doctors", data);
  }

  async updateDoctor(id: string, data: Partial<{
    name: string;
    email: string;
    phone: string;
    speciality: string;
    gender: string;
  }>) {
    return this.put(`/api/doctors/${id}`, data);
  }

  async deleteDoctor(id: string) {
    return this.delete(`/api/doctors/${id}`);
  }

  // Doctor Verification API
  async getDoctorVerification(doctorId: string) {
    return this.get(`/api/doctors/${doctorId}/verification`);
  }

  async submitDoctorVerification(doctorId: string, data: {
    licenseUrl?: string;
    certificateUrl?: string;
    idDocumentUrl?: string;
    otherDocuments?: string;
  }) {
    return this.post(`/api/doctors/${doctorId}/verification`, data);
  }

  // Doctor Config API
  async getDoctorConfig(doctorId: string) {
    return this.get(`/api/doctors/${doctorId}/config`);
  }

  async updateDoctorConfig(doctorId: string, data: {
    slotDuration?: number;
    bookingAdvanceDays?: number;
    minBookingHours?: number;
    timeSlots?: string[];
  }) {
    return this.put(`/api/doctors/${doctorId}/config`, data);
  }

  // Doctor Working Hours API
  async getDoctorWorkingHours(doctorId: string) {
    return this.get(`/api/doctors/${doctorId}/working-hours`);
  }

  async updateDoctorWorkingHours(doctorId: string, data: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isWorking: boolean;
  }>) {
    return this.put(`/api/doctors/${doctorId}/working-hours`, data);
  }

  // Doctor Appointment Types API
  async getDoctorAppointmentTypes(doctorId: string) {
    return this.get(`/api/doctors/${doctorId}/appointment-types`);
  }

  async createDoctorAppointmentType(doctorId: string, data: {
    name: string;
    duration: number;
    description?: string;
    price?: number;
  }) {
    return this.post(`/api/doctors/${doctorId}/appointment-types`, data);
  }

  async updateDoctorAppointmentType(doctorId: string, typeId: string, data: {
    name?: string;
    duration?: number;
    description?: string;
    price?: number;
    isActive?: boolean;
  }) {
    return this.put(`/api/doctors/${doctorId}/appointment-types/${typeId}`, data);
  }

  async deleteDoctorAppointmentType(doctorId: string, typeId: string) {
    return this.delete(`/api/doctors/${doctorId}/appointment-types/${typeId}`);
  }

  // Doctor Available Slots API
  async getDoctorAvailableSlots(doctorId: string, date: string) {
    const queryString = this.buildQueryString({ date });
    return this.get(`/api/doctors/${doctorId}/available-slots${queryString}`);
  }

  // Appointments - Doctor specific
  async getDoctorAppointments(doctorId?: string) {
    const queryString = doctorId ? this.buildQueryString({ doctorId }) : "";
    return this.get(`/api/appointments/doctor${queryString}`);
  }

  // Appointments API
  async getAppointments() {
    return this.get("/api/appointments");
  }

  async getUserAppointments(userId?: string) {
    const queryString = userId ? this.buildQueryString({ userId }) : "";
    return this.get(`/api/appointments/user${queryString}`);
  }

  async getAppointmentById(id: string) {
    return this.get(`/api/appointments/${id}`);
  }

  async bookAppointment(data: {
    doctorId: string;
    date: string;
    time: string;
    reason?: string;
    userId?: string;
  }) {
    return this.post("/api/appointments", data);
  }

  async updateAppointmentStatus(id: string, status: string) {
    return this.put(`/api/appointments/${id}`, { status });
  }

  async getBookedTimeSlots(doctorId: string, date: string) {
    const queryString = this.buildQueryString({ doctorId, date });
    return this.get(`/api/appointments/booked-slots${queryString}`);
  }

  async getAppointmentStats() {
    return this.get("/api/appointments/stats");
  }

  async rescheduleAppointment(id: string, date: string, time: string) {
    return this.post(`/api/appointments/${id}/reschedule`, { date, time });
  }

  async cancelAppointment(id: string, reason?: string) {
    return this.post(`/api/appointments/${id}/cancel`, { reason });
  }

  async exportAppointmentToICS(id: string): Promise<Blob> {
    const url = `${this.baseUrl}/api/appointments/${id}/export`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to export appointment" }));
      throw new Error(error.error || "Failed to export appointment");
    }

    return response.blob();
  }

  // Users API
  async syncUser() {
    return this.post("/api/users/sync");
  }

  async selectUserRole(role: "PATIENT" | "DOCTOR" | "ADMIN") {
    return this.post("/api/users/select-role", { role });
  }

  async getUserProfile() {
    return this.get("/api/users/profile");
  }

  async updateUserProfile(data: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
  }) {
    return this.put("/api/users/profile", data);
  }

  // Admin API
  async getAdminDoctorVerifications(status?: "PENDING" | "APPROVED" | "REJECTED") {
    const queryString = status ? this.buildQueryString({ status }) : "";
    return this.get(`/api/admin/doctors/verification${queryString}`);
  }

  async updateDoctorVerificationStatus(verificationId: string, data: {
    status: "APPROVED" | "REJECTED";
    rejectionReason?: string;
  }) {
    return this.put(`/api/admin/doctors/verification/${verificationId}`, data);
  }

  // Upload API
  async uploadFile(file: File, folder?: string): Promise<{ url: string; publicId: string }> {
    const formData = new FormData();
    formData.append("file", file);
    if (folder) {
      formData.append("folder", folder);
    }

    const url = `${this.baseUrl}/api/upload`;
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to upload file" }));
      throw new Error(error.error || "Failed to upload file");
    }

    return response.json();
  }

  async deleteUploadedFile(publicId?: string, url?: string): Promise<void> {
    const params = new URLSearchParams();
    if (publicId) params.append("publicId", publicId);
    if (url) params.append("url", url);

    const deleteUrl = `${this.baseUrl}/api/upload?${params.toString()}`;
    const response = await fetch(deleteUrl, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to delete file" }));
      throw new Error(error.error || "Failed to delete file");
    }
  }

  // Email API (deprecated - now handled server-side)
  async sendAppointmentEmail(data: {
    userEmail: string;
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: string;
    duration: string;
    price: string;
  }) {
    return this.post("/api/send-appointment-email", data);
  }

  // Payments API - Patient
  async getPatientPayments() {
    return this.get("/api/patients/payments");
  }

  // Payments API - Doctor
  async getDoctorPayments(doctorId: string) {
    return this.get(`/api/doctors/${doctorId}/payments`);
  }

  async getDoctorBilling(doctorId: string, month?: number, year?: number) {
    const params: Record<string, string | number> = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const queryString = this.buildQueryString(params);
    return this.get(`/api/doctors/${doctorId}/billing${queryString}`);
  }

  // Analytics API
  async getAppointmentTrends(period: string) {
    return this.get(`/api/appointments/trends?period=${period}`);
  }

  // Admin Revenue API
  async getAdminRevenue(period?: string) {
    const queryString = period ? this.buildQueryString({ period }) : "";
    return this.get(`/api/admin/revenue${queryString}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClientService();

