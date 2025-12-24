import { NextResponse } from "next/server";

/**
 * Standardized API error response format
 */
export interface ApiErrorResponse {
  error: string;
  details?: Array<{ field: string; message: string }>;
  code?: string;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: Array<{ field: string; message: string }>,
  code?: string
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = { error };
  if (details && details.length > 0) {
    response.details = details;
  }
  if (code) {
    response.code = code;
  }
  return NextResponse.json(response, { status });
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(
  errors: Array<{ field: string; message: string }>
): NextResponse<ApiErrorResponse> {
  return createErrorResponse("Validation failed", 400, errors, "VALIDATION_ERROR");
}

/**
 * Create a not found error response
 */
export function createNotFoundResponse(resource: string = "Resource"): NextResponse<ApiErrorResponse> {
  return createErrorResponse(`${resource} not found`, 404, undefined, "NOT_FOUND");
}

/**
 * Create an unauthorized error response
 */
export function createUnauthorizedResponse(message: string = "Unauthorized"): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 401, undefined, "UNAUTHORIZED");
}

/**
 * Create a forbidden error response
 */
export function createForbiddenResponse(message: string = "Forbidden"): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 403, undefined, "FORBIDDEN");
}

/**
 * Create a server error response
 */
export function createServerErrorResponse(
  message: string = "Internal server error",
  code?: string
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 500, undefined, code || "SERVER_ERROR");
}

/**
 * Create a success response
 */
export function successResponse<T>(
  data?: T,
  message?: string,
  statusCode: number = 200
): NextResponse<{ success: boolean; data?: T; message?: string }> {
  return NextResponse.json({ success: true, data, message }, { status: statusCode });
}

/**
 * Handle Prisma errors and return appropriate response
 */
export function handlePrismaError(error: unknown): NextResponse<ApiErrorResponse> {
  if (typeof error === "object" && error !== null && "code" in error) {
    const prismaError = error as { code: string; meta?: { target?: string[] } };
    
    switch (prismaError.code) {
      case "P2002":
        // Unique constraint violation
        const field = prismaError.meta?.target?.[0] || "field";
        return createErrorResponse(
          `A record with this ${field} already exists`,
          409,
          undefined,
          "DUPLICATE_ENTRY"
        );
      case "P2025":
        // Record not found
        return createNotFoundResponse("Record");
      case "P2003":
        // Foreign key constraint violation
        return createErrorResponse(
          "Invalid reference: related record does not exist",
          400,
          undefined,
          "FOREIGN_KEY_VIOLATION"
        );
      default:
        return createServerErrorResponse("Database operation failed", "DATABASE_ERROR");
    }
  }
  
  return createServerErrorResponse();
}

