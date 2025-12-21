import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import WhatToAsk from "@/components/landing/WhatToAsk";
import Pricing from "@/components/landing/Pricing";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserRoleFromSession } from "@/lib/server/rbac";

/**
 * Home/Landing Page
 * 
 * Optimized for scalability:
 * - Uses getUserRoleFromSession() which has database fallback
 * - Webhooks handle user sync automatically
 * - Only redirects authenticated users, no sync on every page load
 */
export default async function Home() {
  const { userId } = await auth();

  // If user is authenticated, redirect based on role
  if (userId) {
    const role = await getUserRoleFromSession();
    
    // Redirect based on role (from Clerk metadata with DB fallback)
    if (role === "doctor") {
      redirect("/doctor/dashboard");
    } else if (role === "admin") {
      redirect("/admin");
    } else if (role === "patient") {
      redirect("/dashboard");
    }
    // If no role, default to patient dashboard
    // New users will have PATIENT role assigned via webhook
    redirect("/dashboard");
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <HowItWorks />
      <WhatToAsk />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
