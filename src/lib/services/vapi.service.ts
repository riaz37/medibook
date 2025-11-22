import prisma from "@/lib/prisma";
import { BaseService, ApiException } from "./base.service";

/**
 * Vapi Service
 * Handles user identification and helper methods for Vapi integration
 */
class VapiService extends BaseService {
  /**
   * Identify user by phone number
   */
  async identifyUserByPhone(phoneNumber: string) {
    try {
      // Normalize phone number (remove spaces, dashes, etc.)
      const normalizedPhone = phoneNumber.replace(/\D/g, "");
      
      const user = await prisma.user.findFirst({
        where: {
          phone: {
            contains: normalizedPhone,
          },
        },
      });

      return user;
    } catch (error) {
      throw this.handleError(error, "Failed to identify user by phone");
    }
  }

  /**
   * Identify user by email
   */
  async identifyUserByEmail(email: string) {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      const user = await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

      return user;
    } catch (error) {
      throw this.handleError(error, "Failed to identify user by email");
    }
  }

  /**
   * Create or get user by phone and email
   * Creates a new user if they don't exist (for voice callers)
   */
  async createOrGetUser(phoneNumber: string, email: string) {
    try {
      // Try to find by email first
      let user = await this.identifyUserByEmail(email);
      
      if (user) {
        // Update phone if not set
        if (!user.phone && phoneNumber) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { phone: phoneNumber },
          });
        }
        return user;
      }

      // Try to find by phone
      user = await this.identifyUserByPhone(phoneNumber);
      
      if (user) {
        // Update email if not set
        if (!user.email && email) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { email: email.toLowerCase().trim() },
          });
        }
        return user;
      }

      // Create new user (they'll need to complete registration later)
      // Note: We can't create a Clerk user here, so we'll create a DB user
      // that can be linked to Clerk account later
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedPhone = phoneNumber.replace(/\D/g, "");
      
      // Generate a temporary clerkId (will be updated when user registers)
      const tempClerkId = `vapi_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      user = await prisma.user.create({
        data: {
          clerkId: tempClerkId,
          email: normalizedEmail,
          phone: normalizedPhone,
          role: "PATIENT",
        },
      });

      return user;
    } catch (error) {
      throw this.handleError(error, "Failed to create or get user");
    }
  }

  /**
   * Get user from Vapi call context
   * Tries phone first, then email
   */
  async getUserFromCallContext(phoneNumber?: string, email?: string) {
    try {
      if (email) {
        const user = await this.identifyUserByEmail(email);
        if (user) return user;
      }

      if (phoneNumber) {
        const user = await this.identifyUserByPhone(phoneNumber);
        if (user) return user;
      }

      // If both provided but user not found, create new user
      if (phoneNumber && email) {
        return await this.createOrGetUser(phoneNumber, email);
      }

      return null;
    } catch (error) {
      throw this.handleError(error, "Failed to get user from call context");
    }
  }

  private handleError(error: unknown, defaultMessage: string): ApiException {
    if (error instanceof ApiException) {
      return error;
    }
    return new ApiException(
      error instanceof Error ? error.message : defaultMessage,
      undefined,
      error
    );
  }
}

export const vapiService = new VapiService();


