import { Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactInfoProps {
    email?: string | null;
    phone?: string | null;
    className?: string;
    compact?: boolean;
}

export function ContactInfo({ email, phone, className, compact = false }: ContactInfoProps) {
    if (!email && !phone) return null;

    return (
        <div className={cn(compact ? "flex flex-wrap items-center gap-4" : "space-y-1", className)}>
            {email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className={compact ? "truncate max-w-[200px]" : ""}>{email}</span>
                </div>
            )}
            {phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{phone}</span>
                </div>
            )}
        </div>
    );
}
