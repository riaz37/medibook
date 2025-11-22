import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import AdminAnalyticsClient from "./AdminAnalyticsClient";

async function AdminAnalyticsPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/");
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;

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

