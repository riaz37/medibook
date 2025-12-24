import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import { requireRole } from "@/lib/server/rbac";
import { ChartSkeleton } from "@/components/ui/loading-skeleton";

// Lazy load analytics client (contains heavy chart components)
const AdminAnalyticsClient = dynamic(() => import("./AdminAnalyticsClient"), {
  loading: () => <ChartSkeleton height={400} />,
});

async function AdminAnalyticsPage() {
  const authResult = await requireRole("admin");
  
  if ("response" in authResult) {
    redirect("/sign-in");
  }

  return (
    <AdminDashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        <Suspense fallback={<ChartSkeleton height={400} />}>
          <AdminAnalyticsClient />
        </Suspense>
      </div>
    </AdminDashboardLayout>
  );
}

export default AdminAnalyticsPage;

