import dynamic from "next/dynamic";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server/rbac";
import { getCurrentUser } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load landing page components for better code splitting
const Header = dynamic(() => import("@/components/landing/Header"), {
  loading: () => <div className="h-20 bg-background border-b" />,
});

const Hero = dynamic(() => import("@/components/landing/Hero"), {
  loading: () => (
    <div className="min-h-[600px] flex items-center justify-center">
      <div className="space-y-4 w-full max-w-4xl px-4">
        <Skeleton className="h-12 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
        <Skeleton className="h-10 w-48 mx-auto mt-8" />
      </div>
    </div>
  ),
});

const HowItWorks = dynamic(() => import("@/components/landing/HowItWorks"), {
  loading: () => (
    <div className="py-16 space-y-8">
      <Skeleton className="h-10 w-64 mx-auto" />
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  ),
});

const WhatToAsk = dynamic(() => import("@/components/landing/WhatToAsk"), {
  loading: () => (
    <div className="py-16 space-y-8">
      <Skeleton className="h-10 w-64 mx-auto" />
      <div className="max-w-4xl mx-auto px-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  ),
});

const Pricing = dynamic(() => import("@/components/landing/Pricing"), {
  loading: () => (
    <div className="py-16 space-y-8">
      <Skeleton className="h-10 w-64 mx-auto" />
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-96" />
        ))}
      </div>
    </div>
  ),
});

const CTA = dynamic(() => import("@/components/landing/CTA"), {
  loading: () => (
    <div className="py-16">
      <Skeleton className="h-32 w-full max-w-4xl mx-auto" />
    </div>
  ),
});

const Footer = dynamic(() => import("@/components/landing/Footer"), {
  loading: () => <div className="h-64 bg-muted" />,
});

/**
 * Home/Landing Page
 * 
 * Optimized for scalability:
 * - Uses getAuthContext() which returns effective role (accounts for doctorProfile)
 * - Only redirects authenticated users
 * - Lazy loads all landing page components for better performance
 */
export default async function Home() {
  const user = await getCurrentUser();

  // If user is authenticated, redirect based on effective role
  if (user) {
    const context = await getAuthContext();
    
    if (context) {
      // Redirect based on role
      if (context.role === "doctor" || context.role === "doctor_pending") {
        redirect("/doctor/dashboard");
      } else if (context.role === "admin") {
        redirect("/admin");
      } else if (context.role === "patient") {
        redirect("/patient/dashboard");
      }
    }
    // If no context, default to patient dashboard
    redirect("/patient/dashboard");
  }

  // Show landing page for unauthenticated users with lazy loaded components
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="h-20 bg-background border-b" />}>
        <Header />
      </Suspense>
      <Suspense fallback={
        <div className="min-h-[600px] flex items-center justify-center">
          <div className="space-y-4 w-full max-w-4xl px-4">
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
            <Skeleton className="h-10 w-48 mx-auto mt-8" />
          </div>
        </div>
      }>
        <Hero />
      </Suspense>
      <Suspense fallback={
        <div className="py-16 space-y-8">
          <Skeleton className="h-10 w-64 mx-auto" />
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      }>
        <HowItWorks />
      </Suspense>
      <Suspense fallback={
        <div className="py-16 space-y-8">
          <Skeleton className="h-10 w-64 mx-auto" />
          <div className="max-w-4xl mx-auto px-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      }>
        <WhatToAsk />
      </Suspense>
      <Suspense fallback={
        <div className="py-16 space-y-8">
          <Skeleton className="h-10 w-64 mx-auto" />
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      }>
        <Pricing />
      </Suspense>
      <Suspense fallback={
        <div className="py-16">
          <Skeleton className="h-32 w-full max-w-4xl mx-auto" />
        </div>
      }>
        <CTA />
      </Suspense>
      <Suspense fallback={<div className="h-64 bg-muted" />}>
        <Footer />
      </Suspense>
    </div>
  );
}
