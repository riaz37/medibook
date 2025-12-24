"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SignInButtonProps {
  mode?: "modal" | "redirect";
  children?: React.ReactNode;
  redirectUrl?: string;
}

export function SignInButton({ mode = "redirect", children, redirectUrl }: SignInButtonProps) {
  const href = redirectUrl ? `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}` : "/sign-in";
  
  if (children) {
    return <Link href={href}>{children}</Link>;
  }

  return (
    <Link href={href}>
      <Button variant="ghost">Sign In</Button>
    </Link>
  );
}
