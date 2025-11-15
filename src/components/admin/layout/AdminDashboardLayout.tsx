"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminNavbar } from "@/components/navbar/AdminNavbar";

export function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebar />
      <SidebarInset>
        <AdminNavbar />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-20">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

