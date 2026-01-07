import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
    src?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    name?: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
};

export function UserAvatar({ src, firstName, lastName, name, size = "md", className }: UserAvatarProps) {
    const displayName = name || `${firstName || ""} ${lastName || ""}`.trim();
    const initials = displayName
        ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "?";

    return (
        <Avatar className={cn(sizeClasses[size], "border-2 border-primary/20", className)}>
            <AvatarImage src={src || undefined} alt={displayName || "User"} />
            <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
            </AvatarFallback>
        </Avatar>
    );
}
