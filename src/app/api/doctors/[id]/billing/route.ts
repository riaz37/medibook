import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/server/auth-utils";

interface PeriodRange {
  start: Date;
  end: Date;
  month: number;
  year: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getAuthContext();

    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Doctors can only access their own statements; admins can view all
    if (context.role === "doctor" && context.doctorId !== id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    if (context.role === "patient") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = resolvePeriod(searchParams);

    const payments = await prisma.appointmentPayment.findMany({
      where: {
        doctorId: id,
        createdAt: {
          gte: period.start,
          lte: period.end,
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

    return NextResponse.json({
      doctorId: id,
      period: {
        month: period.month,
        year: period.year,
        start: period.start,
        end: period.end,
      },
      totals,
      entries,
    });
  } catch (error) {
    console.error("Error fetching doctor billing data:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing data" },
      { status: 500 }
    );
  }
}

function resolvePeriod(searchParams: URLSearchParams): PeriodRange {
  const now = new Date();
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  const month = monthParam ? Number(monthParam) : now.getMonth() + 1;
  const year = yearParam ? Number(yearParam) : now.getFullYear();

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  return {
    start,
    end,
    month,
    year,
  };
}

