import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

interface ActionCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  actionLabel: string;
  actionHref?: string;
  onActionClick?: () => void;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "outline";
}

/**
 * Card component with action button
 * Provides consistent styling for cards with call-to-action buttons
 */
export function ActionCard({
  title,
  description,
  children,
  actionLabel,
  actionHref,
  onActionClick,
  className,
  icon: Icon,
  variant = "default",
}: ActionCardProps) {
  const actionButton = (
    <Button variant={variant === "outline" ? "outline" : "default"} onClick={onActionClick}>
      {actionLabel}
    </Button>
  );

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
            <CardTitle>{title}</CardTitle>
          </div>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
      <CardContent className="pt-0">
        {actionHref ? (
          <Link href={actionHref} className="block">
            {actionButton}
          </Link>
        ) : (
          actionButton
        )}
      </CardContent>
    </Card>
  );
}

