import { NextRequest, NextResponse } from "next/server";
import { doctorsServerService } from "@/lib/services/server";
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
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    const billingData = await doctorsServerService.getBillingData(id, {
      month: monthParam ? Number(monthParam) : undefined,
      year: yearParam ? Number(yearParam) : undefined,
    });

    return NextResponse.json(billingData);
  } catch (error) {
    console.error("Error fetching doctor billing data:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing data" },
      { status: 500 }
    );
  }
}


