import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import WhatToAsk from "@/components/landing/WhatToAsk";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Home/Landing Page
 * 
 * Optimized for scalability:
 * - Uses session claims (from Clerk) instead of DB queries
 * - Webhooks handle user sync automatically
 * - Only redirects authenticated users, no sync on every page load
 */
export default async function Home() {
  const { userId, sessionClaims } = await auth();

  // If user is authenticated, redirect based on role from session claims
  // This avoids DB queries on every page load
  if (userId) {
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    
    // Redirect based on role (from Clerk metadata, synced by webhooks)
    if (role === "doctor") {
      redirect("/doctor/dashboard");
    } else if (role === "admin") {
      redirect("/admin");
    } else if (role === "patient") {
      redirect("/dashboard");
    }
    // If no role in session claims, redirect to select-role
    // The select-role page will check DB and sync metadata if needed
    redirect("/select-role");
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <HowItWorks />
      <WhatToAsk />
      <CTA />
      <Footer />
    </div>
  );
}
