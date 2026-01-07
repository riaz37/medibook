import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SettingsFormSkeletonProps {
    fields?: number;
    showHeader?: boolean;
}

export function SettingsFormSkeleton({ fields = 4, showHeader = true }: SettingsFormSkeletonProps) {
    return (
        <Card>
            {showHeader && (
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
            )}
            <CardContent className="space-y-6">
                {Array.from({ length: fields }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
                <div className="flex justify-end gap-2 pt-4">
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-28" />
                </div>
            </CardContent>
        </Card>
    );
}

export function SettingsTabsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex gap-2 border-b pb-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-20" />
            </div>
            <SettingsFormSkeleton />
        </div>
    );
}
