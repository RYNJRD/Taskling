import type { User } from "../../../shared/schema";
import { cn } from "../lib/utils";
import { getOutfitImage } from "../lib/avatar";

interface UserAvatarProps {
  user: Pick<User, "username" | "avatarConfig">;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const outfitImg = getOutfitImage(user.avatarConfig);

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
        "relative overflow-hidden shrink-0 border-2 border-white/80 dark:border-white/10 shadow-sm bg-gradient-to-b from-violet-50 to-sky-50 dark:from-violet-950/40 dark:to-sky-950/40",
        isSmall ? "rounded-full" : "rounded-[28px]",
        sizeClasses[size],
        className,
      )}
    >
      <img
        src={outfitImg}
        alt={user.username}
        draggable={false}
        className={cn(
          "absolute inset-0 w-full h-full pointer-events-none select-none",
          isSmall
            ? "object-cover object-top scale-[1.6] origin-top"
            : "object-contain object-bottom",
        )}
      />
    </div>
  );
}
