"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Home,
  Settings,
  Wallet,
  BarChart3,
  CreditCard,
  FileText,
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
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserButton } from "@/components/shared/UserButton";
import Image from "next/image";

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

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.url}>
                          <Icon />
                          <span>{item.title}</span>
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
              {user?.emailAddresses?.[0]?.emailAddress}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

