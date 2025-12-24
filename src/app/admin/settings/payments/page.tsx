import { requireRole } from "@/lib/server/rbac";
import { redirect } from "next/navigation";
import { AdminDashboardLayout } from "@/components/admin/layout/AdminDashboardLayout";
import PaymentSettingsClient from "./PaymentSettingsClient";

// Mark page as dynamic (uses auth which requires headers)
export const dynamic = "force-dynamic";

async function PaymentSettingsPage() {
  const authResult = await requireRole("admin");
  if ("response" in authResult) {
    redirect("/sign-in");
  }

  return (
    <AdminDashboardLayout>
      <div className="max-w-4xl mx-auto w-full">
        <PaymentSettingsClient />
      </div>
    </AdminDashboardLayout>
  );
}

export default PaymentSettingsPage;

