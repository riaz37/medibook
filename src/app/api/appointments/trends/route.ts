import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/server/auth-utils";
import { subDays, format, startOfDay } from "date-fns";

// GET /api/appointments/trends - Get appointment trends for charts
export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "7"; // 7, 30, or 90 days
    const days = parseInt(period);

    // Build where clause based on role
    let whereClause: any = {};
    if (context.role === "patient") {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: context.clerkUserId },
        select: { id: true },
      });
      if (dbUser) {
        whereClause.userId = dbUser.id;
      } else {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    } else if (context.role === "doctor" && context.doctorId) {
      whereClause.doctorId = context.doctorId;
    }

    const startDate = startOfDay(subDays(new Date(), days));
    
    // Get appointments grouped by date
    const appointments = await prisma.appointment.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
        date: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

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

    // Count appointments by date
    appointments.forEach((apt) => {
      const dateKey = format(apt.createdAt, "yyyy-MM-dd");
      if (trends[dateKey]) {
        trends[dateKey].total++;
        if (apt.status === "CONFIRMED") {
          trends[dateKey].confirmed++;
        }
        if (apt.status === "COMPLETED") {
          trends[dateKey].completed++;
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

