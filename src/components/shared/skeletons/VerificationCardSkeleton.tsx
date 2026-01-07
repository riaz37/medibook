import { Skeleton } from "@/components/ui/skeleton";

export function VerificationCardSkeleton() {
    return (
        <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-28" />
                    </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
            </div>
        </div>
    );
}

export function VerificationListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <VerificationCardSkeleton key={i} />
            ))}
        </div>
    );
}
