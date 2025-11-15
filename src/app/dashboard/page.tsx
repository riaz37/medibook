import { redirect } from "next/navigation";

/**
 * Legacy Route Redirect
 * Redirects /dashboard to /patient/dashboard for better route organization
 */
export default function DashboardRedirect() {
  redirect("/patient/dashboard");
}
