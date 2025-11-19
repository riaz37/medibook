import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/server/auth-utils";

/**
 * GET /api/admin/revenue
 * Get platform revenue statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext();

    if (!context || context.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
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

    // Fetch appointment types separately
    const paymentsWithTypes = await Promise.all(
      recentPayments.map(async (payment) => {
        let appointmentType = null;
        if (payment.appointment?.appointmentTypeId) {
          appointmentType = await prisma.doctorAppointmentType.findUnique({
            where: { id: payment.appointment.appointmentTypeId },
            select: {
              id: true,
              name: true,
            },
          });
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
      })
    );

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

