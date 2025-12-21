/**
 * Users Server Service
 * Handles all server-side user database operations and business logic.
 * 
 * This is server-only and should never be imported in client components.
 * 
 * Note: This file does not use "use server" because it exports classes, interfaces,
 * and instances, not Server Actions. Server Actions can only export async functions.
 * This service is used in API routes and server components, not as a Server Action.
 */

import { BaseServerService, ServerServiceError } from "./base-server.service";
import type { Prisma, User, UserRole } from "@/generated/prisma/client";

export interface FindUsersOptions {
  role?: UserRole;
  include?: Prisma.UserInclude;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
}

class UsersServerService extends BaseServerService {
  /**
   * Find multiple users with filters
   */
  async findMany(options: FindUsersOptions = {}): Promise<User[]> {
    return this.execute(async () => {
      const where: Prisma.UserWhereInput = {};

      if (options.role) {
        where.role = options.role;
      }

      return await this.prisma.user.findMany({
        where,
        include: options.include,
        orderBy: { createdAt: "desc" },
      });
    }, "Failed to find users");
  }

  /**
   * Find user by ID
   */
  async findUnique(
    id: string,
    include?: Prisma.UserInclude
  ): Promise<User | null> {
    this.validateRequired({ id }, ["id"]);

    return this.execute(async () => {
      return await this.prisma.user.findUnique({
        where: { id },
        include,
      });
    }, "Failed to find user");
  }

  /**
   * Find user by Clerk ID
   */
  async findUniqueByClerkId(
    clerkId: string,
    include?: Prisma.UserInclude
  ): Promise<User | null> {
    this.validateRequired({ clerkId }, ["clerkId"]);

    return this.execute(async () => {
      return await this.prisma.user.findUnique({
        where: { clerkId },
        include,
      });
    }, "Failed to find user by Clerk ID");
  }

  /**
   * Find user by email
   */
  async findUniqueByEmail(
    email: string,
    include?: Prisma.UserInclude
  ): Promise<User | null> {
    this.validateRequired({ email }, ["email"]);

    return this.execute(async () => {
      return await this.prisma.user.findUnique({
        where: { email },
        include,
      });
    }, "Failed to find user by email");
  }

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    this.validateRequired({ id }, ["id"]);

    return this.execute(async () => {
      const existing = await this.findUnique(id);
      if (!existing) {
        throw new ServerServiceError("User not found", 404, "NOT_FOUND");
      }

      const updateData: Prisma.UserUpdateInput = {};

      if (data.firstName !== undefined) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.role !== undefined) updateData.role = data.role;

      return await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
    }, "Failed to update user");
  }

  /**
   * Update user role
   */
  async updateRole(id: string, role: UserRole): Promise<User> {
    this.validateRequired({ id, role }, ["id", "role"]);

    return this.execute(async () => {
      return await this.update(id, { role });
    }, "Failed to update user role");
  }

  /**
   * Sync user from Clerk (upsert operation)
   * This is a wrapper around the existing syncUserDirect function
   * but can be extended with service layer patterns
   */
  async syncFromClerk(clerkId: string, userData: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    role?: UserRole;
  }): Promise<User> {
    this.validateRequired({ clerkId, email: userData.email }, ["clerkId", "email"]);

    return this.execute(async () => {
      // Check if email is in admin list
      const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
      const isAdminEmail = adminEmails.includes(userData.email.toLowerCase());
      
      // Get signup intent from Clerk metadata
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkId);
      const metadata = clerkUser.publicMetadata as { signupIntent?: string; role?: string } | undefined;
      const signupIntent = metadata?.signupIntent;
      
      // Determine role based on signup intent or admin email
      let assignedRole: UserRole;
      if (isAdminEmail) {
        assignedRole = "ADMIN";
      } else if (signupIntent === "doctor") {
        assignedRole = "DOCTOR";
      } else {
        assignedRole = userData.role || "PATIENT";
      }

      // Upsert user
      return await this.prisma.user.upsert({
        where: { clerkId },
        update: {
          email: userData.email,
          firstName: userData.firstName || undefined,
          lastName: userData.lastName || undefined,
          phone: userData.phone || undefined,
          ...(isAdminEmail && { role: "ADMIN" }),
          ...(signupIntent === "doctor" && { role: "DOCTOR" }),
        },
        create: {
          clerkId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role: assignedRole,
        },
      });
    }, "Failed to sync user from Clerk");
  }

  /**
   * Get user with doctor profile
   */
  async findUniqueWithDoctorProfile(id: string): Promise<User & { doctorProfile?: unknown } | null> {
    return this.findUnique(id, {
      doctorProfile: true,
    });
  }

  /**
   * Check if user exists
   */
  async exists(id: string): Promise<boolean> {
    const user = await this.findUnique(id, {
      select: { id: true },
    } as any);
    return user !== null;
  }
}

// Export singleton instance
export const usersServerService = new UsersServerService();

