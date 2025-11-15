import { z } from "zod";
import { NextResponse } from "next/server";

/**
 * Validate request body with Zod schema
 * Returns parsed data or error response
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError && error.errors && Array.isArray(error.errors)) {
      const errors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Validation failed",
            details: errors,
          },
          { status: 400 }
        ),
      };
    }

    // Log unexpected error structure for debugging
    console.error("Validation error:", error);
    
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: "Invalid request data",
          message: error instanceof Error ? error.message : "Unknown validation error"
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  query: Record<string, string | string[] | undefined>
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    // Convert query params to object, taking first value if array
    const queryObj = Object.fromEntries(
      Object.entries(query).map(([key, value]) => [
        key,
        Array.isArray(value) ? value[0] : value,
      ])
    );

    const parsed = schema.parse(queryObj);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError && error.errors && Array.isArray(error.errors)) {
      const errors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Invalid query parameters",
            details: errors,
          },
          { status: 400 }
        ),
      };
    }

    // Log unexpected error structure for debugging
    console.error("Query validation error:", error);
    
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: "Invalid query parameters",
          message: error instanceof Error ? error.message : "Unknown validation error"
        },
        { status: 400 }
      ),
    };
  }
}

