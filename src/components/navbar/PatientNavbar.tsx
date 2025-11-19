"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import type { Notification } from "@/components/shared/NotificationCenter";

export function PatientNavbar() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications (in a real app, this would come from an API)
  useEffect(() => {
    // Example notifications - in production, fetch from API
    const exampleNotifications: Notification[] = [];
    setNotifications(exampleNotifications);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    if (!pathname) return [];
    
    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs = [{ label: "Home", href: "/patient/dashboard" }];

    if (paths.length === 0) return breadcrumbs;

    paths.forEach((path, index) => {
      const href = "/" + paths.slice(0, index + 1).join("/");
      const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");
      breadcrumbs.push({ label, href });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-4 px-6">
        <SidebarTrigger />
        
        {/* Breadcrumbs */}
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <div key={`${crumb.href}-${index}`} className="flex items-center">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-2">
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDismiss={handleDismiss}
          />
          <AnimatedThemeToggler className="h-9 w-9" />
        </div>
      </div>
    </header>
  );
}

