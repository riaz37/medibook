import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardHeroSkeleton() {
    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                    <Skeleton className="h-7 w-32 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-9 w-72" />
            </div>
            <Skeleton className="h-11 w-48 mt-4 md:mt-0" />
        </div>
    );
}

export function ScheduleCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-5 w-20" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                        <Skeleton className="h-12 w-12 rounded" />
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <Skeleton className="h-3 w-40" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export function QuickActionsSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4 flex flex-col items-center gap-2">
                        <Skeleton className="h-10 w-10 rounded" />
                        <Skeleton className="h-4 w-20" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
