"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Calendar,
  Mic,
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
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserButton } from "@/components/shared/UserButton";
import Image from "next/image";

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
        title: "Find a Doctor",
        url: "/doctors",
        icon: Stethoscope,
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
    title: "Medical",
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
  const { user } = useCurrentUser();

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

