"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

/**
 * User button component - replacement for Clerk's UserButton
 */
export function UserButton() {
  const { user } = useCurrentUser();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Logged out successfully");
        router.push("/sign-in");
        router.refresh();
      } else {
        toast.error("Failed to logout");
      }
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
