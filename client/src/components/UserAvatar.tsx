import type { User } from "@shared/schema";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: User;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  let config: any = {};
  try {
    config = JSON.parse(user.avatarConfig || "{}");
  } catch (e) {
    config = {};
  }

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-24 h-24",
    xl: "w-48 h-48",
  };

  const scale = {
    sm: "scale-[0.15]",
    md: "scale-[0.22]",
    lg: "scale-[0.45]",
    xl: "scale-1",
  };

  return (
    <div className={cn(
      "relative bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0",
      sizeClasses[size],
      className
    )}>
      <div className={cn("relative flex items-center justify-center transition-transform", scale[size])}>
        {/* Base Character Body */}
        <div className="absolute w-12 h-12 bg-slate-300 rounded-full border-2 border-slate-400 z-0 top-[20%]" />
        
        {/* Clothing Layers */}
        <div className="relative w-64 h-64 flex flex-col items-center justify-center pt-8">
          {/* Jacket (Top Layer) */}
          {config.jacket === 'default' && (
            <img 
              src="/avatar/jacket_layer.png" 
              alt="Jacket" 
              className="absolute top-[10%] w-[60%] h-[50%] object-contain z-20"
            />
          )}

          {/* Pants (Bottom Layer) */}
          {config.pants === 'default' && (
            <img 
              src="/avatar/pants_layer.png" 
              alt="Pants" 
              className="absolute bottom-[10%] w-[50%] h-[50%] object-contain z-10"
            />
          )}
        </div>
      </div>
    </div>
  );
}
