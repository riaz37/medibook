import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DoctorCardSkeletonProps {
    variant?: "default" | "compact" | "grid";
}

export function DoctorCardSkeleton({ variant = "default" }: DoctorCardSkeletonProps) {
    if (variant === "compact" || variant === "grid") {
        return (
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-20" />
                            <div className="flex gap-2">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </div>
                    </div>
                    <Skeleton className="h-9 w-full mt-3" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex gap-6">
                    <Skeleton className="h-32 w-32 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex gap-3">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-5 w-14 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex gap-3 pt-2">
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-10 w-28" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function DoctorListSkeleton({ count = 3, variant = "default" }: { count?: number; variant?: "default" | "compact" | "grid" }) {
    return (
        <div className={variant === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4"}>
            {Array.from({ length: count }).map((_, i) => (
                <DoctorCardSkeleton key={i} variant={variant} />
            ))}
        </div>
    );
}
