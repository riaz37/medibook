import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface InfoCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Generic info card component
 * Provides consistent styling for information display
 */
export function InfoCard({ title, description, children, className, icon: Icon }: InfoCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          <CardTitle>{title}</CardTitle>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

