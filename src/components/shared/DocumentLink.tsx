import { FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentLinkProps {
    label: string;
    url: string;
    className?: string;
}

export function DocumentLink({ label, url, className }: DocumentLinkProps) {
    return (
        <div className={cn("flex items-center gap-2 p-2 border rounded", className)}>
            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm flex-1 truncate">{label}</span>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex-shrink-0"
            >
                <ExternalLink className="w-4 h-4" />
            </a>
        </div>
    );
}
