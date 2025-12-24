"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Calendar,
  User,
  CreditCard,
  FileText,
  Heart,
  Stethoscope,
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
import { useUserAppointments } from "@/hooks";
import { UserButton } from "@/components/shared/UserButton";
import Image from "next/image";
import { useMemo } from "react";

const menuItems = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/patient/dashboard",
        icon: Home,
        badge: null,
      },
    ],
  },
  {
    title: "Appointments",
    items: [
      {
        title: "Find & Book Doctor",
        url: "/patient/appointments?tab=find-book",
        icon: Stethoscope,
        badge: null,
      },
      {
        title: "My Appointments",
        url: "/patient/appointments?tab=my-appointments",
        icon: Calendar,
        badge: "upcoming", // Will show upcoming count
      },
    ],
  },
  {
    title: "Health & Care",
    items: [
      {
        title: "Medical History",
        url: "/patient/medical-history",
        icon: Heart,
        badge: null,
      },
      {
        title: "Prescriptions",
        url: "/patient/prescriptions",
        icon: FileText,
        badge: null,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Payments",
        url: "/patient/payments",
        icon: CreditCard,
        badge: null,
      },
      {
        title: "Profile",
        url: "/patient/profile",
        icon: User,
        badge: null,
      },
    ],
  },
];

export function PatientSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useCurrentUser();
  const { data: appointments = [] } = useUserAppointments();

  // Calculate upcoming appointments count
  const upcomingCount = useMemo(() => {
    if (!appointments || appointments.length === 0) return 0;
    const now = new Date();
    return appointments.filter((apt: any) => {
      const aptDate = new Date(apt.date);
      return aptDate >= now && (apt.status === "CONFIRMED" || apt.status === "PENDING");
    }).length;
  }, [appointments]);

  return (
    <Sidebar collapsible="icon" variant="inset">
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
            <span className="text-xs text-muted-foreground">Patient Portal</span>
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
                  // Handle active state for appointments with tab query params
                  let isActive = false;
                  if (item.url.includes("?tab=")) {
                    const urlPath = item.url.split("?")[0];
                    const tabParam = item.url.split("tab=")[1];
                    const currentTab = searchParams.get("tab");
                    isActive = pathname === urlPath && currentTab === tabParam;
                  } else {
                    isActive = pathname === item.url || pathname?.startsWith(item.url + "/");
                  }
                  const Icon = item.icon;

                  // Determine badge value
                  let badgeValue: number | null = null;
                  if (item.badge === "upcoming" && upcomingCount > 0) {
                    badgeValue = upcomingCount;
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link href={item.url} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Icon />
                            <span>{item.title}</span>
                          </div>
                          {badgeValue !== null && (
                            <Badge variant="secondary" className="ml-auto h-5 min-w-5 px-1.5 text-xs">
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
