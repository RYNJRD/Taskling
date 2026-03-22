import type { User } from "@shared/schema";
import { cn } from "@/lib/utils";
import { AVATAR_OPTIONS, parseAvatarConfig } from "@/lib/avatar";

interface UserAvatarProps {
  user: User;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

function findOption(section: keyof typeof AVATAR_OPTIONS, id: string | null | undefined) {
  return AVATAR_OPTIONS[section].find((option) => option.id === id) ?? AVATAR_OPTIONS[section][0];
}

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const config = parseAvatarConfig(user.avatarConfig);
  const hair = findOption("hair", config.hair);
  const top = findOption("top", config.top);
  const bottom = findOption("bottom", config.bottom);
  const accessory = findOption("accessory", config.accessory);

  const sizeClasses = {
    sm: "w-8 h-8 text-[8px]",
    md: "w-12 h-12 text-[10px]",
    lg: "w-24 h-24 text-sm",
    xl: "w-48 h-48 text-2xl",
  };

  return (
    <div
      className={cn(
        "relative rounded-[28px] overflow-hidden border-2 border-white bg-gradient-to-b from-sky-100 via-white to-violet-50 shadow-sm shrink-0",
        sizeClasses[size],
        className,
      )}
    >
      <div className="absolute inset-x-[18%] top-[14%] h-[22%] rounded-t-[999px] bg-slate-800 opacity-90" />
      <div className={cn("absolute inset-x-[18%] top-[10%] h-[24%] opacity-95", hair.className)} />
      <div className="absolute inset-x-[24%] top-[20%] h-[28%] rounded-[999px] bg-amber-100 border border-amber-200" />
      <div className={cn("absolute inset-x-[22%] top-[46%] h-[26%] rounded-[30%]", top.className)} />
      <div className={cn("absolute inset-x-[26%] bottom-[4%] h-[24%] rounded-t-[30%]", bottom.className)} />
      <div className="absolute inset-x-[38%] bottom-[4%] h-[22%] w-[24%] mx-auto rounded-full bg-white/30" />

      {accessory.id === "star-clip" && <div className="absolute top-[14%] right-[18%] text-yellow-400">⭐</div>}
      {accessory.id === "headphones" && <div className="absolute top-[20%] inset-x-[18%] text-center">🎧</div>}
      {accessory.id === "glasses" && <div className="absolute top-[28%] inset-x-[25%] text-center">🕶️</div>}
      {accessory.id === "sparkle" && <div className="absolute top-[16%] left-[18%] text-primary">✨</div>}
    </div>
  );
}
