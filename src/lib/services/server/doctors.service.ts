/**
 * Doctors Server Service
 * Handles all server-side doctor database operations and business logic.
 * 
 * This is server-only and should never be imported in client components.
 * 
 * Note: This file does not use "use server" because it exports classes, interfaces,
 * and instances, not Server Actions. Server Actions can only export async functions.
 * This service is used in API routes and server components, not as a Server Action.
 */

import { BaseServerService, ServerServiceError } from "./base-server.service";
import type { Prisma, Doctor, Gender } from "@/generated/prisma/client";
import { cacheService, CacheKeys, CacheTTL } from "./cache.service";

export interface FindDoctorsOptions {
  isVerified?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  include?: Prisma.DoctorInclude;
}

export interface CreateDoctorData {
  name: string;
  email: string;
  phone: string;
  speciality: string;
  gender: Gender;
  bio?: string;
  imageUrl?: string;
  userId?: string;
}

export interface UpdateDoctorData {
  name?: string;
  email?: string;
  phone?: string;
  speciality?: string;
  gender?: Gender;
  bio?: string;
  imageUrl?: string;
  isVerified?: boolean;
}

export interface BillingPeriod {
  month: number;
  year: number;
  start: Date;
  end: Date;
}

export interface BillingData {
  doctorId: string;
  period: BillingPeriod;
  totals: {
    totalAppointments: number;
    completedAppointments: number;
    grossRevenue: number;
    totalCommission: number;
    totalPayouts: number;
    totalRefunds: number;
  };
  entries: Array<{
    paymentId: string;
    appointmentId: string;
    appointmentDate: Date | null;
    appointmentTime: string | null;
    appointmentStatus: string | null;
    patientName: string | null;
    appointmentPrice: number;
    commissionAmount: number;
    doctorPayoutAmount: number;
    patientPaid: boolean;
    doctorPaid: boolean;
    status: string;
    refunded: boolean;
    refundAmount: number | null;
    createdAt: Date;
  }>;
}

class DoctorsServerService extends BaseServerService {
  /**
   * Find multiple doctors with filters
   */
  async findMany(options: FindDoctorsOptions = {}): Promise<Doctor[]> {
    return this.execute(async () => {
      const where: Prisma.DoctorWhereInput = {};

      if (options.isVerified !== undefined) {
        where.isVerified = options.isVerified;
      }

      if (options.search) {
        where.OR = [
          { name: { contains: options.search, mode: 'insensitive' } },
          { speciality: { contains: options.search, mode: 'insensitive' } },
        ];
      }

      const defaultInclude: Prisma.DoctorInclude = {
        _count: {
          select: { appointments: true },
        },
      };

      return await this.prisma.doctor.findMany({
        where,
        include: options.include || defaultInclude,
        orderBy: { createdAt: "desc" },
        take: options.limit,
        skip: options.offset,
      });
    }, "Failed to find doctors");
  }

  /**
   * Count doctors with filters
   */
  async count(options: Omit<FindDoctorsOptions, "include" | "limit" | "offset"> = {}): Promise<number> {
    return this.execute(async () => {
      const where: Prisma.DoctorWhereInput = {};

      if (options.isVerified !== undefined) {
        where.isVerified = options.isVerified;
      }

      if (options.search) {
        where.OR = [
          { name: { contains: options.search, mode: 'insensitive' } },
          { speciality: { contains: options.search, mode: 'insensitive' } },
        ];
      }

      return await this.prisma.doctor.count({ where });
    }, "Failed to count doctors");
  }

  /**
   * Find doctor by ID
   */
  async findUnique(
    id: string,
    include?: Prisma.DoctorInclude
  ): Promise<Doctor | null> {
    this.validateRequired({ id }, ["id"]);

    return this.execute(async () => {
      // Use cache for simple queries without includes
      if (!include) {
        return await this.cachedQuerySWR(
          CacheKeys.doctor(id),
          () => this.prisma.doctor.findUnique({ where: { id } }),
          CacheTTL.LONG, // 10 minutes fresh
          CacheTTL.DAY   // 24 hours stale
        );
      }

      // Skip cache for complex queries with includes
      return await this.prisma.doctor.findUnique({
        where: { id },
        include,
      });
    }, "Failed to find doctor");
  }

  /**
   * Find doctor by email
   */
  async findUniqueByEmail(email: string): Promise<Doctor | null> {
    this.validateRequired({ email }, ["email"]);

    return this.execute(async () => {
      return await this.prisma.doctor.findUnique({
        where: { email },
      });
    }, "Failed to find doctor by email");
  }

  /**
   * Create a new doctor
   */
  async create(data: CreateDoctorData): Promise<Doctor> {
    this.validateRequired(data, ["name", "email", "phone", "speciality", "gender"]);

    return this.execute(async () => {
      // Check if email already exists
      const existing = await this.findUniqueByEmail(data.email);
      if (existing) {
        throw new ServerServiceError(
          "A doctor with this email already exists",
          409,
          "EMAIL_EXISTS"
        );
      }

      return await this.prisma.doctor.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          speciality: data.speciality,
          gender: data.gender,
          bio: data.bio ?? null,
          imageUrl: data.imageUrl ?? "",
          ...(data.userId && { userId: data.userId }),
          isVerified: false, // New doctors start unverified
        },
      }).then(async (doctor) => {
        // Invalidate doctors list cache
        await this.invalidateCachePattern('medibook:doctors:*');
        return doctor;
      });
    }, "Failed to create doctor");
  }

  /**
   * Update doctor
   */
  async update(id: string, data: UpdateDoctorData): Promise<Doctor> {
    this.validateRequired({ id }, ["id"]);

    return this.execute(async () => {
      const existing = await this.findUnique(id);
      if (!existing) {
        throw new ServerServiceError("Doctor not found", 404, "NOT_FOUND");
      }

      // If email is changing, check if the new email already exists
      if (data.email && data.email !== existing.email) {
        const emailExists = await this.findUniqueByEmail(data.email);
        if (emailExists) {
          throw new ServerServiceError(
            "A doctor with this email already exists",
            409,
            "EMAIL_EXISTS"
          );
        }
      }

      const updateData: Prisma.DoctorUpdateInput = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.speciality !== undefined) updateData.speciality = data.speciality;
      if (data.gender !== undefined) updateData.gender = data.gender;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;

      return await this.prisma.doctor.update({
        where: { id },
        data: updateData,
      }).then(async (doctor) => {
        // Invalidate caches
        await this.invalidateCache(CacheKeys.doctor(id));
        await this.invalidateCachePattern('medibook:doctors:*');
        return doctor;
      });
    }, "Failed to update doctor");
  }

  /**
   * Delete doctor
   */
  async delete(id: string): Promise<void> {
    this.validateRequired({ id }, ["id"]);

    return this.execute(async () => {
      await this.prisma.doctor.delete({
        where: { id },
      });

      // Invalidate caches
      await this.invalidateCache(CacheKeys.doctor(id));
      await this.invalidateCachePattern('medibook:doctors:*');
    }, "Failed to delete doctor");
  }

  /**
   * Get available (verified) doctors
   */
  async getAvailable(): Promise<Doctor[]> {
    return await this.cachedQuerySWR(
      CacheKeys.availableDoctors(),
      () => this.findMany({ isVerified: true }),
      CacheTTL.MEDIUM, // 5 minutes fresh
      CacheTTL.HOUR    // 1 hour stale
    );
  }

  /**
   * Get all doctors for admin (includes unverified)
   * Excludes admins - admins should not have doctor profiles (they're created by script)
   */
  async getAllForAdmin(): Promise<Doctor[]> {
    return this.execute(async () => {
      // Get admin role ID to exclude admins
      const adminRole = await this.prisma.role.findUnique({
        where: { name: "admin" },
        select: { id: true },
      });

      const where: Prisma.DoctorWhereInput = {};
      
      // Exclude doctors where the user has admin role
      // Include doctors without userId (standalone doctor profiles)
      if (adminRole) {
        where.OR = [
          { userId: null }, // Doctors without user accounts
          {
            user: {
              roleId: {
                not: adminRole.id,
              },
            },
          },
        ];
      }

      const defaultInclude: Prisma.DoctorInclude = {
        _count: {
          select: { appointments: true },
        },
      };

      return await this.prisma.doctor.findMany({
        where,
        include: defaultInclude,
        orderBy: { createdAt: "desc" },
      });
    }, "Failed to fetch doctors");
  }

  /**
   * Get doctor billing data for a specific period
   */
  async getBillingData(
    doctorId: string,
    period: { month?: number; year?: number }
  ): Promise<BillingData> {
    this.validateRequired({ doctorId }, ["doctorId"]);

    return this.execute(async () => {
      const now = new Date();
      const month = period.month || now.getMonth() + 1;
      const year = period.year || now.getFullYear();

      const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      const payments = await this.prisma.appointmentPayment.findMany({
        where: {
          doctorId,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          appointment: {
            select: {
              date: true,
              time: true,
              status: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const totals = payments.reduce(
        (acc, payment) => {
          const price = Number(payment.appointmentPrice);
          const commission = Number(payment.commissionAmount);
          const payout = Number(payment.doctorPayoutAmount);
          const refunded = payment.refunded ? Number(payment.refundAmount || 0) : 0;

          acc.totalAppointments += 1;
          acc.grossRevenue += price;
          acc.totalCommission += commission;
          acc.totalPayouts += payout;
          acc.totalRefunds += refunded;

          if (payment.status === "COMPLETED") {
            acc.completedAppointments += 1;
          }

          return acc;
        },
        {
          totalAppointments: 0,
          completedAppointments: 0,
          grossRevenue: 0,
          totalCommission: 0,
          totalPayouts: 0,
          totalRefunds: 0,
        }
      );

      const entries = payments.map((payment) => ({
        paymentId: payment.id,
        appointmentId: payment.appointmentId,
        appointmentDate: payment.appointment?.date ?? null,
        appointmentTime: payment.appointment?.time ?? null,
        appointmentStatus: payment.appointment?.status ?? null,
        patientName: payment.appointment?.user
          ? `${payment.appointment.user.firstName || ""} ${payment.appointment.user.lastName || ""}`.trim()
          : null,
        appointmentPrice: Number(payment.appointmentPrice),
        commissionAmount: Number(payment.commissionAmount),
        doctorPayoutAmount: Number(payment.doctorPayoutAmount),
        patientPaid: payment.patientPaid,
        doctorPaid: payment.doctorPaid,
        status: payment.status,
        refunded: payment.refunded,
        refundAmount: payment.refundAmount ? Number(payment.refundAmount) : null,
        createdAt: payment.createdAt,
      }));

      return {
        doctorId,
        period: {
          month,
          year,
          start,
          end,
        },
        totals,
        entries,
      };
    }, "Failed to get billing data");
  }

  /**
   * Get doctor verification documents
   */
  async getVerification(doctorId: string) {
    this.validateRequired({ doctorId }, ["doctorId"]);

    return this.execute(async () => {
      return await this.prisma.doctorVerification.findUnique({
        where: { doctorId },
      });
    }, "Failed to get verification");
  }

  /**
   * Check if doctor exists and is verified
   */
  async isVerified(doctorId: string): Promise<boolean> {
    return this.execute(async () => {
      const doctor = await this.prisma.doctor.findUnique({
        where: { id: doctorId },
        select: { isVerified: true },
      });
      return doctor?.isVerified || false;
    }, "Failed to check doctor verification status");
  }
}

// Export singleton instance
export const doctorsServerService = new DoctorsServerService();

