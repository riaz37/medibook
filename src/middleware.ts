import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/", // Landing page - public
  "/api/vapi-get-user-appointments",
  "/api/vapi-book-appointment",
  "/api/vapi-get-doctors",
  "/api/vapi-get-available-times",
  "/api/send-appointment-email",
  "/api/webhooks/stripe", // Stripe webhook - must be public
  "/api/settings/commission", // Commission percentage - needed for preview
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isDoctorRoute = createRouteMatcher(["/doctor(.*)"]);
const isPatientRoute = createRouteMatcher(["/patient(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");

  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    if (!userId) {
      // API routes should return JSON errors, not redirects
      if (isApiRoute) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      // Page routes redirect to sign-in
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Get role from session claims (set by Clerk metadata)
  // This is more scalable than querying DB on every request
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Protect admin routes - require admin role
  if (isAdminRoute(req)) {
    if (role !== "admin") {
      // API routes return JSON errors
      if (isApiRoute) {
        return NextResponse.json(
          { error: "Forbidden: Admin access required" },
          { status: 403 }
        );
      }
      // Page routes redirect
      const url = new URL("/", req.url);
      return NextResponse.redirect(url);
    }
  }

  // Protect doctor routes - require doctor role
  if (isDoctorRoute(req)) {
    if (role !== "doctor" && role !== "admin") {
      // API routes return JSON errors
      if (isApiRoute) {
        return NextResponse.json(
          { error: "Forbidden: Doctor access required" },
          { status: 403 }
        );
      }
      // Page routes redirect
      const url = new URL("/", req.url);
      return NextResponse.redirect(url);
    }
  }

  // Protect patient routes - require patient role (or no role set yet, which will redirect to select-role)
  if (isPatientRoute(req)) {
    if (role === "doctor" || role === "admin") {
      // API routes return JSON errors
      if (isApiRoute) {
        return NextResponse.json(
          { error: "Forbidden: Patient access required" },
          { status: 403 }
        );
      }
      // Page routes redirect based on role
      if (role === "doctor") {
        const url = new URL("/doctor/dashboard", req.url);
        return NextResponse.redirect(url);
      } else if (role === "admin") {
        const url = new URL("/admin", req.url);
        return NextResponse.redirect(url);
      }
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
