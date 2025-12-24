import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface DetailItem {
  label: string;
  value: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}

interface DetailCardProps {
  title: string;
  items: DetailItem[];
  className?: string;
  actions?: ReactNode;
}

/**
 * Detail view card component
 * Provides consistent styling for displaying key-value pairs
 */
export function DetailCard({ title, items, className, actions }: DetailCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {actions && <div>{actions}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              {item.icon && (
                <item.icon className="h-4 w-4 text-muted-foreground mt-0.5" />
              )}
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground">{item.label}</div>
                <div className="text-base mt-1">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

