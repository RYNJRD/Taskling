import maleModelImg from "@assets/d228ba9d-e9b6-44a6-a3bf-ba22f99114fd_removalai_preview_1775090740007.png";
import femaleModelImg from "@assets/c033f10f-b630-4dab-b599-e1e948a32c27_removalai_preview_1775090736187.png";
import type { User } from "@shared/schema";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: Pick<User, "username" | "gender" | "avatarConfig">;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const isFemale = user.gender === "female";
  const baseModel = isFemale ? femaleModelImg : maleModelImg;

  const sizeClasses: Record<string, string> = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-24 h-24",
    xl: "w-48 h-48",
  };

  const isSmall = size === "sm" || size === "md";

  return (
    <div
      className={cn(
        "relative overflow-hidden shrink-0 border-2 border-white/80 shadow-sm bg-gradient-to-b from-violet-50 to-sky-50",
        isSmall ? "rounded-full" : "rounded-[28px]",
        sizeClasses[size],
        className,
      )}
    >
      <img
        src={baseModel}
        alt={user.username}
        draggable={false}
        className={cn(
          "absolute inset-0 w-full h-full pointer-events-none select-none",
          isSmall
            ? "object-cover object-top scale-[1.8] origin-top"
            : "object-contain object-top",
        )}
      />
    </div>
  );
}
