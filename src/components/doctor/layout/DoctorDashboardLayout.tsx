"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DoctorSidebar } from "./DoctorSidebar";
import { DoctorNavbar } from "@/components/navbar/DoctorNavbar";

export function DoctorDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <DoctorSidebar />
      <SidebarInset>
        <DoctorNavbar />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-20">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

