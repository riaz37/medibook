import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/server/rbac";
import { subDays, format, startOfDay } from "date-fns";
import { Prisma } from "@/generated/prisma/client";

// Mark route as dynamic (uses auth which requires headers)
export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 minutes

// GET /api/appointments/trends - Get appointment trends for charts
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    
    const { context } = authResult;

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "7"; // 7, 30, or 90 days
    const days = parseInt(period);

    // Build where clause based on role
    let whereClause: any = {};
    if (context.role === "patient") {
      whereClause.userId = context.userId;
    } else if ((context.role === "doctor" || context.role === "doctor_pending") && context.doctorId) {
      whereClause.doctorId = context.doctorId;
    }

    const startDate = startOfDay(subDays(new Date(), days));

    // Use raw SQL for efficient database-level aggregation
    const userId = whereClause.userId;
    const doctorId = whereClause.doctorId;

    const rawStats = await prisma.$queryRaw<Array<{ date_key: string; status: string; count: number }>>`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM-DD') as date_key,
        "status",
        COUNT(*)::int as count
      FROM "appointments"
      WHERE "createdAt" >= ${startDate}
      ${userId ? Prisma.sql`AND "userId" = ${userId}` : Prisma.empty}
      ${doctorId ? Prisma.sql`AND "doctorId" = ${doctorId}` : Prisma.empty}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD'), "status"
    `;

    // Group by date
    const trends: Record<string, { date: string; total: number; confirmed: number; completed: number }> = {};

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), days - 1 - i);
      const dateKey = format(date, "yyyy-MM-dd");
      trends[dateKey] = {
        date: format(date, "MMM d"),
        total: 0,
        confirmed: 0,
        completed: 0,
      };
    }

    // Fill with data from DB
    rawStats.forEach((stat) => {
      const dateKey = stat.date_key;
      if (trends[dateKey]) {
        trends[dateKey].total += stat.count;
        if (stat.status === "CONFIRMED") {
          trends[dateKey].confirmed += stat.count;
        }
        if (stat.status === "COMPLETED") {
          trends[dateKey].completed += stat.count;
        }
      }
    });

    const data = Object.values(trends);

    return NextResponse.json({
      period: days,
      data,
    });
  } catch (error) {
    console.error("Error fetching appointment trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch trends" },
      { status: 500 }
    );
  }
}

