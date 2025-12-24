import { redirect } from "next/navigation";
import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import AdminAnalyticsClient from "./AdminAnalyticsClient";
import { getCurrentUser } from "@/lib/auth";

async function AdminAnalyticsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role = user.role?.name || user.userRole.toLowerCase();

  if (role !== "admin") {
    if (role === "doctor") {
      redirect("/doctor/dashboard");
    } else {
      redirect("/patient/dashboard");
    }
  }

  return (
    <AdminDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        <AdminAnalyticsClient />
      </div>
    </AdminDashboardLayout>
  );
}

export default AdminAnalyticsPage;

