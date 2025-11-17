"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Home,
  Settings,
  Users,
  BarChart3,
  DollarSign,
  Bell,
  Stethoscope,
  FileText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

const menuItems = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        url: "/doctor/dashboard",
        icon: Home,
        badge: null,
      },
      {
        title: "Appointments",
        url: "/doctor/appointments",
        icon: Calendar,
        badge: null,
      },
      {
        title: "Settings",
        url: "/doctor/settings",
        icon: Settings,
        badge: null,
      },
    ],
  },
  {
    title: "Upcoming",
    items: [
      {
        title: "Patients",
        url: "#",
        icon: Users,
        badge: "Coming Soon",
        disabled: true,
      },
      {
        title: "Analytics",
        url: "#",
        icon: BarChart3,
        badge: "Coming Soon",
        disabled: true,
      },
      {
        title: "Revenue",
        url: "#",
        icon: DollarSign,
        badge: "Coming Soon",
        disabled: true,
      },
      {
        title: "Calendar",
        url: "#",
        icon: Calendar,
        badge: "Coming Soon",
        disabled: true,
      },
      {
        title: "Notifications",
        url: "#",
        icon: Bell,
        badge: "Coming Soon",
        disabled: true,
      },
    ],
  },
];

export function DoctorSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

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
                  const isDisabled = "disabled" in item && item.disabled === true;
                  const isActive = !isDisabled && pathname?.startsWith(item.url);

                  if (isDisabled) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          disabled
                          tooltip={item.title}
                          className="opacity-50 cursor-not-allowed"
                        >
                          <Icon />
                          <span>{item.title}</span>
                          {item.badge && (
                            <SidebarMenuBadge>
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            </SidebarMenuBadge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.url}>
                          <Icon />
                          <span>{item.title}</span>
                          {item.badge && (
                            <SidebarMenuBadge>
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            </SidebarMenuBadge>
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
    </Sidebar>
  );
}

