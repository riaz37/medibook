import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

/**
 * Admin Dashboard
 * 
 * Optimized for scalability:
 * - Uses session claims for role checking (no DB query)
 * - Middleware already handles admin route protection
 */
async function AdminPage() {
  const { userId, sessionClaims } = await auth();

  // User is not logged in
  if (!userId) {
    redirect("/");
  }

  // Get role from session claims (more scalable than DB query)
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // If user doesn't have ADMIN role, redirect
  if (role !== "admin") {
    // Redirect based on user's actual role
    if (role === "doctor") {
      redirect("/doctor/dashboard");
    } else {
      redirect("/dashboard");
    }
  }

  return <AdminDashboardClient />;
}

export default AdminPage;
