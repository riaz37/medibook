"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { PatientSidebar } from "./PatientSidebar";
import { PatientNavbar } from "@/components/navbar/PatientNavbar";

interface PatientDashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Patient Dashboard Layout
 * Provides sidebar navigation and top navbar for patient pages
 */
export function PatientDashboardLayout({ children }: PatientDashboardLayoutProps) {
  return (
    <SidebarProvider>
      <PatientSidebar />
      <SidebarInset>
        <PatientNavbar />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-20">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

