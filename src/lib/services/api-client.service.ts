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

  // Users API
  async syncUser() {
    return this.post("/api/users/sync");
  }

  // Email API
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
}

// Export singleton instance
export const apiClient = new ApiClientService();

