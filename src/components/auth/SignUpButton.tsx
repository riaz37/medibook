"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SignUpButtonProps {
  mode?: "modal" | "redirect";
  children?: React.ReactNode;
  redirectUrl?: string;
}

export function SignUpButton({ mode = "redirect", children, redirectUrl }: SignUpButtonProps) {
  const href = redirectUrl ? `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}` : "/sign-up";
  
  if (children) {
    return <Link href={href}>{children}</Link>;
  }

  return (
    <Link href={href}>
      <Button>Sign Up</Button>
    </Link>
  );
}
