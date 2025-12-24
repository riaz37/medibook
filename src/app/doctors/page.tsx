import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAuthContext } from "@/lib/server/rbac";

/**
 * Legacy Route Redirect
 * Redirects /doctors to /patient/appointments?tab=find-book
 * for the unified appointments page
 */
async function DoctorsPage() {
  const user = await getCurrentUser();

  if (!user || !user.role) {
    redirect("/sign-in");
  }

  // Check email verification
  if (!user.emailVerified) {
    redirect("/verify-email");
  }

  const context = await getAuthContext();

  // Redirect doctors (pending or verified) and admins to their respective dashboards
  if (context?.role === "doctor" || context?.role === "doctor_pending") {
    redirect("/doctor/dashboard");
  } else if (context?.role === "admin") {
    redirect("/admin");
  }

  // Redirect to unified appointments page with Find & Book tab
  redirect("/patient/appointments?tab=find-book");
}

export default DoctorsPage;
