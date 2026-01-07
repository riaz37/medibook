import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AppointmentCardSkeletonProps {
    variant?: "default" | "compact";
}

export function AppointmentCardSkeleton({ variant = "default" }: AppointmentCardSkeletonProps) {
    if (variant === "compact") {
        return (
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-40" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                    <Skeleton className="h-5 w-24 rounded-full" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <div className="flex gap-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-9 w-24" />
                            <Skeleton className="h-9 w-20" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function AppointmentListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <AppointmentCardSkeleton key={i} />
            ))}
        </div>
    );
}
