import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | string;

interface AppointmentStatusBadgeProps {
    status: AppointmentStatus;
    className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: {
        label: "Pending",
        className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    },
    CONFIRMED: {
        label: "Confirmed",
        className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    COMPLETED: {
        label: "Completed",
        className: "bg-green-500/10 text-green-600 border-green-500/20",
    },
    CANCELLED: {
        label: "Cancelled",
        className: "bg-red-500/10 text-red-600 border-red-500/20",
    },
};

export function AppointmentStatusBadge({ status, className }: AppointmentStatusBadgeProps) {
    const config = statusConfig[status] || { label: status, className: "" };

    return (
        <Badge variant="outline" className={cn(config.className, className)}>
            {config.label}
        </Badge>
    );
}
