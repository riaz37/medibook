"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Calendar,
  Mic,
  FileText,
  Settings,
  User,
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
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

const menuItems = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        url: "/patient/dashboard",
        icon: Home,
        badge: null,
      },
      {
        title: "Appointments",
        url: "/patient/appointments",
        icon: Calendar,
        badge: null,
      },
      {
        title: "Voice Assistant",
        url: "/patient/voice",
        icon: Mic,
        badge: null,
      },
    ],
  },
  {
    title: "Upcoming",
    items: [
      {
        title: "Health Records",
        url: "#",
        icon: FileText,
        badge: "Coming Soon",
        disabled: true,
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
  const { user } = useUser();

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
                  const isActive = pathname === item.url || pathname?.startsWith(item.url + "/");
                  const Icon = item.icon;
                  const isDisabled = "disabled" in item && item.disabled === true;

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
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
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
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <User className="size-4 text-primary" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
            <span className="truncate text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

