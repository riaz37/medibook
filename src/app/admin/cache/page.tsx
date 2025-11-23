import { Metadata } from "next";
import { getAuthContext } from "@/lib/server/auth-utils";
import { redirect } from "next/navigation";
import CacheDashboardClient from "./CacheDashboardClient";

export const metadata: Metadata = {
  title: "Cache Management | MediBook Admin",
  description: "Monitor and manage application cache",
};

export default async function CacheManagementPage() {
  const context = await getAuthContext();

  if (!context || context.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Cache Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor cache performance and manage cache entries.
        </p>
      </div>

      <CacheDashboardClient />
    </div>
  );
}
