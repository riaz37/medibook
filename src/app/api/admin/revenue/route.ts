import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/server/rbac";
import { subDays, format, startOfDay } from "date-fns";
import { cacheService, CacheTTL } from "@/lib/services/server/cache.service";

export const revalidate = 300; // 5 minutes

/**
 * GET /api/admin/revenue
 * Get platform revenue statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole("admin");
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period");

    // If period is specified, return trends data
    if (period) {
      const days = parseInt(period);
      const startDate = startOfDay(subDays(new Date(), days));

      const payments = await prisma.appointmentPayment.findMany({
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          createdAt: true,
          commissionAmount: true,
          patientPaid: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // Group by date
      const trends: Record<string, { date: string; revenue: number; commission: number }> = {};

      // Initialize all dates in range
      for (let i = 0; i < days; i++) {
        const date = subDays(new Date(), days - 1 - i);
        const dateKey = format(date, "yyyy-MM-dd");
        trends[dateKey] = {
          date: format(date, "MMM d"),
          revenue: 0,
          commission: 0,
        };
      }

      // Sum payments by date
      payments.forEach((payment) => {
        const dateKey = format(payment.createdAt, "yyyy-MM-dd");
        if (trends[dateKey]) {
          trends[dateKey].revenue += Number(payment.patientPaid || 0);
          trends[dateKey].commission += Number(payment.commissionAmount || 0);
        }
      });

      return NextResponse.json({
        period: days,
        data: Object.values(trends),
      });
    }

    // Get total revenue (only COMPLETED payments count as revenue)
    // Refunded payments should not add to revenue
    const totalRevenueResult = await prisma.appointmentPayment.aggregate({
      where: {
        status: "COMPLETED",
      },
      _sum: {
        commissionAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get refunded commission amounts to subtract
    const refundedCommissionResult = await prisma.appointmentPayment.aggregate({
      where: {
        status: { in: ["REFUNDED", "PARTIALLY_REFUNDED"] },
      },
      _sum: {
        commissionAmount: true,
      },
    });

    // Get monthly revenue (current month) - only COMPLETED payments
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenueResult = await prisma.appointmentPayment.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        commissionAmount: true,
      },
    });

    // Get monthly refunded commission to subtract
    const monthlyRefundedResult = await prisma.appointmentPayment.aggregate({
      where: {
        status: { in: ["REFUNDED", "PARTIALLY_REFUNDED"] },
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        commissionAmount: true,
      },
    });

    // Get recent payments (last 50)
    const recentPayments = await prisma.appointmentPayment.findMany({
      where: {
        status: { in: ["COMPLETED", "REFUNDED", "PARTIALLY_REFUNDED"] },
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointmentTypeId: true,
            date: true,
            time: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Fetch all unique appointment types in one query
    const appointmentTypeIds = Array.from(
      new Set(
        recentPayments
          .map((p) => p.appointment?.appointmentTypeId)
          .filter((id): id is string => !!id)
      )
    );

    const appointmentTypes = await prisma.doctorAppointmentType.findMany({
      where: {
        id: { in: appointmentTypeIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const appointmentTypeMap = new Map(appointmentTypes.map((t) => [t.id, t]));

    const paymentsWithTypes = recentPayments.map((payment) => {
      let appointmentType = null;
      if (payment.appointment?.appointmentTypeId) {
        appointmentType = appointmentTypeMap.get(payment.appointment.appointmentTypeId) || null;
      }
      return {
        ...payment,
        appointment: payment.appointment
          ? {
            ...payment.appointment,
            appointmentType,
          }
          : null,
      };
    });

    // Calculate net revenue (completed commissions minus refunded commissions)
    const totalRevenue = Number(totalRevenueResult._sum.commissionAmount || 0) -
      Number(refundedCommissionResult._sum.commissionAmount || 0);
    const monthlyRevenue = Number(monthlyRevenueResult._sum.commissionAmount || 0) -
      Number(monthlyRefundedResult._sum.commissionAmount || 0);

    return NextResponse.json({
      totalRevenue: Math.max(0, totalRevenue), // Ensure non-negative
      monthlyRevenue: Math.max(0, monthlyRevenue), // Ensure non-negative
      totalAppointments: totalRevenueResult._count.id,
      recentPayments: paymentsWithTypes,
    });
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue" },
      { status: 500 }
    );
  }
}

