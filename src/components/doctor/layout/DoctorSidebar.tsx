"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Home,
  Settings,
  Wallet,
  FileText,
  CreditCard,
  BarChart3,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDoctorAppointments } from "@/hooks";
import { UserButton } from "@/components/shared/UserButton";
import Image from "next/image";
import { useMemo } from "react";

const menuItems = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/doctor/dashboard",
        icon: Home,
        badge: null,
      },
    ],
  },
  {
    title: "Appointments",
    items: [
      {
        title: "Appointments",
        url: "/doctor/appointments",
        icon: Calendar,
        badge: "pending", // Will show pending count
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        title: "Analytics",
        url: "/doctor/analytics",
        icon: BarChart3,
        badge: null,
      },
    ],
  },
  {
    title: "Prescriptions",
    items: [
      {
        title: "Prescriptions",
        url: "/doctor/prescriptions",
        icon: FileText,
        badge: null,
      },
    ],
  },
  {
    title: "Financial",
    items: [
      {
        title: "Billing",
        url: "/doctor/billing",
        icon: Wallet,
        badge: null,
      },
      {
        title: "Payment Setup",
        url: "/doctor/settings/payments",
        icon: CreditCard,
        badge: null,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        title: "Settings",
        url: "/doctor/settings",
        icon: Settings,
        badge: null,
      },
    ],
  },
];

export function DoctorSidebar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { data: appointments = [] } = useDoctorAppointments();

  // Calculate pending appointments count
  const pendingCount = useMemo(() => {
    return appointments.filter((apt: any) => apt.status === "PENDING").length;
  }, [appointments]);

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-4">
          <Image
            src="/logo.png"
            alt="Medibook"
            width={32}
            height={32}
            className="size-8"
          />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm">Medibook</span>
            <span className="text-xs text-muted-foreground">Doctor Portal</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.url || pathname?.startsWith(item.url + "/");
                  
                  // Determine badge value
                  let badgeValue: number | null = null;
                  if (item.badge === "pending" && pendingCount > 0) {
                    badgeValue = pendingCount;
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.url} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Icon />
                            <span>{item.title}</span>
                          </div>
                          {badgeValue !== null && (
                            <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1.5 text-xs">
                              {badgeValue}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <UserButton />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0 flex-1">
            <span className="truncate text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.email}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
