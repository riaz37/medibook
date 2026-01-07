import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | string;

interface VerificationStatusBadgeProps {
    status: VerificationStatus;
    className?: string;
    showIcon?: boolean;
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
    PENDING: {
        label: "Pending",
        className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
        icon: Clock,
    },
    APPROVED: {
        label: "Approved",
        className: "bg-green-500/10 text-green-600 border-green-500/20",
        icon: CheckCircle2,
    },
    REJECTED: {
        label: "Rejected",
        className: "bg-red-500/10 text-red-600 border-red-500/20",
        icon: XCircle,
    },
};

export function VerificationStatusBadge({ status, className, showIcon = false }: VerificationStatusBadgeProps) {
    const config = statusConfig[status] || { label: status, className: "", icon: AlertCircle };
    const Icon = config.icon;

    return (
        <Badge variant="outline" className={cn("flex items-center gap-1", config.className, className)}>
            {showIcon && <Icon className="w-3 h-3" />}
            {config.label}
        </Badge>
    );
}
