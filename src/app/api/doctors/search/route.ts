import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { createServerErrorResponse, createErrorResponse } from "@/lib/utils/api-response";

export interface DoctorSearchParams {
  query?: string;           // Search by name, speciality
  speciality?: string;      // Filter by speciality
  city?: string;           // Filter by city
  state?: string;          // Filter by state
  country?: string;        // Filter by country
  minRating?: number;      // Minimum rating (0-5)
  maxPrice?: number;       // Maximum consultation fee
  availableOn?: string;    // Date (YYYY-MM-DD) to check availability
  gender?: "MALE" | "FEMALE";
  languages?: string[];    // Languages spoken
  yearsOfExperience?: number; // Minimum years of experience
  sortBy?: "rating" | "price" | "experience" | "name" | "reviews";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// GET /api/doctors/search - Advanced doctor search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: DoctorSearchParams = {
      query: searchParams.get("query") || undefined,
      speciality: searchParams.get("speciality") || undefined,
      city: searchParams.get("city") || undefined,
      state: searchParams.get("state") || undefined,
      country: searchParams.get("country") || undefined,
      minRating: searchParams.get("minRating") ? parseFloat(searchParams.get("minRating")!) : undefined,
      maxPrice: searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined,
      availableOn: searchParams.get("availableOn") || undefined,
      gender: searchParams.get("gender") as "MALE" | "FEMALE" | undefined,
      languages: searchParams.get("languages")?.split(",").filter(Boolean) || undefined,
      yearsOfExperience: searchParams.get("yearsOfExperience") ? parseInt(searchParams.get("yearsOfExperience")!) : undefined,
      sortBy: (searchParams.get("sortBy") as DoctorSearchParams["sortBy"]) || "rating",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      page: parseInt(searchParams.get("page") || "1"),
      limit: Math.min(parseInt(searchParams.get("limit") || "20"), 50), // Max 50
    };

    const where: Prisma.DoctorWhereInput = {
      isVerified: true, // Only show verified doctors
    };

    // Text search
    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: "insensitive" } },
        { speciality: { contains: params.query, mode: "insensitive" } },
        { bio: { contains: params.query, mode: "insensitive" } },
      ];
    }

    // Speciality filter
    if (params.speciality) {
      where.speciality = { equals: params.speciality, mode: "insensitive" };
    }

    // Location filters
    if (params.city) {
      where.city = { equals: params.city, mode: "insensitive" };
    }
    if (params.state) {
      where.state = { equals: params.state, mode: "insensitive" };
    }
    if (params.country) {
      where.country = { equals: params.country, mode: "insensitive" };
    }

    // Rating filter
    if (params.minRating !== undefined) {
      where.rating = { gte: params.minRating };
    }

    // Price filter
    if (params.maxPrice !== undefined) {
      where.consultationFee = { lte: params.maxPrice };
    }

    // Gender filter
    if (params.gender) {
      where.gender = params.gender;
    }

    // Years of experience filter
    if (params.yearsOfExperience !== undefined) {
      where.yearsOfExperience = { gte: params.yearsOfExperience };
    }

    // Languages filter (JSON array)
    if (params.languages && params.languages.length > 0) {
      // This will check if any of the specified languages are in the languages field
      where.OR = params.languages.map(lang => ({
        languages: { contains: lang, mode: "insensitive" as const },
      }));
    }

    // Sorting
    let orderBy: Prisma.DoctorOrderByWithRelationInput = {};
    switch (params.sortBy) {
      case "rating":
        orderBy = { rating: params.sortOrder };
        break;
      case "price":
        orderBy = { consultationFee: params.sortOrder === "asc" ? "asc" : "desc" };
        break;
      case "experience":
        orderBy = { yearsOfExperience: params.sortOrder === "asc" ? "asc" : "desc" };
        break;
      case "name":
        orderBy = { name: params.sortOrder };
        break;
      case "reviews":
        orderBy = { totalReviews: params.sortOrder };
        break;
      default:
        orderBy = { rating: "desc" };
    }

    // Pagination
    const skip = ((params.page || 1) - 1) * (params.limit || 20);

    // Execute query
    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        orderBy,
        skip,
        take: params.limit || 20,
        include: {
          availability: {
            select: {
              slotDuration: true,
              bookingAdvanceDays: true,
            },
          },
          appointmentTypes: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              duration: true,
              price: true,
            },
          },
          workingHours: {
            where: { isWorking: true },
            select: {
              dayOfWeek: true,
              startTime: true,
              endTime: true,
            },
          },
          _count: {
            select: {
              appointments: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.doctor.count({ where }),
    ]);

    // Check availability if date specified
    let doctorsWithAvailability = doctors;
    if (params.availableOn) {
      const targetDate = new Date(params.availableOn);
      const dayOfWeek = targetDate.getDay();

      // Filter doctors who work on this day
      doctorsWithAvailability = doctors.filter((doctor) => {
        const workingDay = doctor.workingHours.find(
          (wh) => wh.dayOfWeek === dayOfWeek
        );
        return workingDay !== undefined;
      });
    }

    // Format response
    const formattedDoctors = doctorsWithAvailability.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      speciality: doctor.speciality,
      bio: doctor.bio,
      imageUrl: doctor.imageUrl,
      gender: doctor.gender,
      address: doctor.address,
      city: doctor.city,
      state: doctor.state,
      country: doctor.country,
      rating: Number(doctor.rating),
      totalReviews: doctor.totalReviews,
      yearsOfExperience: doctor.yearsOfExperience,
      consultationFee: doctor.consultationFee ? Number(doctor.consultationFee) : null,
      languages: doctor.languages ? JSON.parse(doctor.languages) : [],
      education: doctor.education ? JSON.parse(doctor.education) : [],
      certifications: doctor.certifications ? JSON.parse(doctor.certifications) : [],
      appointmentTypes: doctor.appointmentTypes.map((at) => ({
        ...at,
        price: at.price ? Number(at.price) : null,
      })),
      workingHours: doctor.workingHours,
      availability: doctor.availability,
      appointmentCount: doctor._count.appointments,
      reviewCount: doctor._count.reviews,
    }));

    return NextResponse.json({
      doctors: formattedDoctors,
      pagination: {
        total,
        page: params.page || 1,
        limit: params.limit || 20,
        totalPages: Math.ceil(total / (params.limit || 20)),
        hasMore: skip + formattedDoctors.length < total,
      },
      filters: {
        query: params.query,
        speciality: params.speciality,
        city: params.city,
        state: params.state,
        minRating: params.minRating,
        maxPrice: params.maxPrice,
        availableOn: params.availableOn,
        gender: params.gender,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      },
    });
  } catch (error) {
    console.error("[GET /api/doctors/search] Error:", error);
    return createServerErrorResponse("Failed to search doctors");
  }
}

// GET /api/doctors/search/specialities - Get unique specialities
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "specialities") {
      const specialities = await prisma.doctor.findMany({
        where: { isVerified: true },
        select: { speciality: true },
        distinct: ["speciality"],
        orderBy: { speciality: "asc" },
      });

      return NextResponse.json({
        specialities: specialities.map((s) => s.speciality),
      });
    }

    if (action === "locations") {
      const [cities, states] = await Promise.all([
        prisma.doctor.findMany({
          where: { isVerified: true, city: { not: null } },
          select: { city: true },
          distinct: ["city"],
          orderBy: { city: "asc" },
        }),
        prisma.doctor.findMany({
          where: { isVerified: true, state: { not: null } },
          select: { state: true },
          distinct: ["state"],
          orderBy: { state: "asc" },
        }),
      ]);

      return NextResponse.json({
        cities: cities.map((c) => c.city).filter(Boolean),
        states: states.map((s) => s.state).filter(Boolean),
      });
    }

    return createErrorResponse("Invalid action", 400, undefined, "INVALID_ACTION");
  } catch (error) {
    console.error("[POST /api/doctors/search] Error:", error);
    return createServerErrorResponse("Failed to fetch filter options");
  }
}
