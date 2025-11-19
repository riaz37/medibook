"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  CheckCircle2,
  Settings,
  BarChart3,
  User,
  FileText,
  Bell,
  DollarSign,
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
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useUser, UserButton } from "@clerk/nextjs";
import Image from "next/image";

const menuItems = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        url: "/admin",
        icon: Home,
        badge: null,
      },
      {
        title: "Doctors",
        url: "/admin/doctors",
        icon: Users,
        badge: null,
      },
      {
        title: "Verifications",
        url: "/admin/verifications",
        icon: CheckCircle2,
        badge: null,
      },
      {
        title: "Settings",
        url: "/admin/settings",
        icon: Settings,
        badge: null,
      },
    ],
  },
  {
    title: "Upcoming",
    items: [
      {
        title: "Analytics",
        url: "#",
        icon: BarChart3,
        badge: "Coming Soon",
        disabled: true,
      },
      {
        title: "Users",
        url: "#",
        icon: User,
        badge: "Coming Soon",
        disabled: true,
      },
      {
        title: "Audit Logs",
        url: "#",
        icon: FileText,
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
      {
        title: "Revenue",
        url: "#",
        icon: DollarSign,
        badge: "Coming Soon",
        disabled: true,
      },
    ],
  },
];

export function AdminSidebar() {
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
            <span className="text-xs text-muted-foreground">Admin Portal</span>
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
                  const isActive = !item.disabled && (pathname === item.url || pathname?.startsWith(item.url + "/"));
                  const isDisabled = item.disabled;

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

