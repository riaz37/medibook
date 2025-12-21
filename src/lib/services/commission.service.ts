import prisma from "@/lib/prisma";

/**
 * Commission Service
 * Handles commission calculation and platform settings
 */
export class CommissionService {
  private static readonly DEFAULT_COMMISSION_PERCENTAGE = 5.0; // 5%

  /**
   * Get the current platform commission percentage
   * Returns default if no settings exist
   */
  async getCommissionPercentage(): Promise<number> {
    try {
      // Try to get settings (there should only be one record)
      const settings = await prisma.platformSettings.findFirst({
        orderBy: { createdAt: "desc" },
      });

      if (settings) {
        return Number(settings.commissionPercentage);
      }

      // If no settings exist, create default
      await this.initializeDefaultSettings();
      return CommissionService.DEFAULT_COMMISSION_PERCENTAGE;
    } catch (error) {
      console.error("Error getting commission percentage:", error);
      return CommissionService.DEFAULT_COMMISSION_PERCENTAGE;
    }
  }

  /**
   * Calculate commission amount from appointment price
   * Business model: 5% commission
   */
  calculateCommission(appointmentPrice: number, commissionPercentage?: number): {
    commissionAmount: number;
    doctorPayoutAmount: number;
    commissionPercentageUsed: number;
  } {
    const percentage = commissionPercentage ?? CommissionService.DEFAULT_COMMISSION_PERCENTAGE;
    
    // Calculate commission as percentage of appointment price
    const commissionAmount = (appointmentPrice * percentage) / 100;
    const doctorPayoutAmount = appointmentPrice - commissionAmount;

    return {
      commissionAmount: Number(commissionAmount.toFixed(2)),
      doctorPayoutAmount: Number(doctorPayoutAmount.toFixed(2)),
      commissionPercentageUsed: percentage,
    };
  }

  /**
   * Get doctor's net revenue (what they receive after commission)
   */
  getDoctorRevenue(appointmentPrice: number, commissionPercentage?: number): number {
    const { doctorPayoutAmount } = this.calculateCommission(appointmentPrice, commissionPercentage);
    return doctorPayoutAmount;
  }

  /**
   * Initialize default platform settings if they don't exist
   */
  private async initializeDefaultSettings(): Promise<void> {
    try {
      const existing = await prisma.platformSettings.findFirst();
      if (!existing) {
        await prisma.platformSettings.create({
          data: {
            commissionPercentage: CommissionService.DEFAULT_COMMISSION_PERCENTAGE,
          },
        });
      }
    } catch (error) {
      console.error("Error initializing default settings:", error);
    }
  }

  /**
   * Update commission percentage (admin only)
   */
  async updateCommissionPercentage(
    newPercentage: number,
    updatedBy?: string
  ): Promise<void> {
    // Validate percentage (must be positive)
    if (newPercentage <= 0 || newPercentage > 100) {
      throw new Error(
        "Commission percentage must be between 0% and 100%"
      );
    }

    try {
      // Get or create settings
      const existing = await prisma.platformSettings.findFirst();
      
      if (existing) {
        await prisma.platformSettings.update({
          where: { id: existing.id },
          data: {
            commissionPercentage: newPercentage,
            updatedBy,
          },
        });
      } else {
        await prisma.platformSettings.create({
          data: {
            commissionPercentage: newPercentage,
            updatedBy,
          },
        });
      }
    } catch (error) {
      console.error("Error updating commission percentage:", error);
      throw new Error("Failed to update commission percentage");
    }
  }

  /**
   * Get platform settings
   */
  async getPlatformSettings() {
    try {
      const settings = await prisma.platformSettings.findFirst({
        orderBy: { createdAt: "desc" },
      });

      if (!settings) {
        await this.initializeDefaultSettings();
        return await prisma.platformSettings.findFirst({
          orderBy: { createdAt: "desc" },
        });
      }

      return settings;
    } catch (error) {
      console.error("Error getting platform settings:", error);
      throw new Error("Failed to get platform settings");
    }
  }
}

export const commissionService = new CommissionService();

