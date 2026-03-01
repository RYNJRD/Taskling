import { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, Clock, Users } from "lucide-react";
import type { Chore, User } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { UserAvatar } from "./UserAvatar";

interface ChoreCardProps {
  chore: Chore;
  onComplete: () => void;
  isCompleting: boolean;
  displayPoints?: number;
  streakBonusPercent?: number;
}

const EMOJI_MAP: Record<string, string> = {
  "dish": "🍽️",
  "tidy": "✨",
  "lawn": "🚜",
  "grass": "🌱",
  "laundry": "🧺",
  "dog": "🐕",
  "trash": "🗑️",
  "room": "🏠",
  "floor": "🧹",
  "clean": "🧼",
};

function getEmoji(chore: Chore) {
  if (chore.emoji) return chore.emoji;
  const title = chore.title;
  if (/\p{Emoji}/u.test(title)) return "";
  const t = title.toLowerCase();
  for (const [key, val] of Object.entries(EMOJI_MAP)) {
    if (t.includes(key)) return val;
  }
  return "📋";
}

const TYPE_COLORS: Record<string, { border: string; check: string; bg: string }> = {
  daily: { border: "border-primary", check: "border-primary bg-primary/10 text-primary", bg: "hover:bg-primary/10" },
  weekly: { border: "border-blue-500", check: "border-blue-500 bg-blue-500/10 text-blue-500", bg: "hover:bg-blue-500/10" },
  monthly: { border: "border-purple-500", check: "border-purple-500 bg-purple-500/10 text-purple-500", bg: "hover:bg-purple-500/10" },
  big: { border: "border-secondary", check: "border-secondary bg-secondary/10 text-secondary", bg: "hover:bg-secondary/10" },
  box: { border: "border-accent", check: "border-accent bg-accent/10 text-accent", bg: "hover:bg-accent/10" },
};

export const ChoreCard = forwardRef<HTMLDivElement, ChoreCardProps>(
  ({ chore, onComplete, isCompleting, displayPoints, streakBonusPercent }, ref) => {
    const [isConfirming, setIsConfirming] = useState(false);
    const isBox = chore.type === 'box';
    const isPublic = chore.assigneeId === null;
    const typeKey = chore.type || 'daily';
    const colors = TYPE_COLORS[typeKey] || TYPE_COLORS.daily;
    
    const { data: users = [] } = useQuery<User[]>({
      queryKey: [buildUrl(api.families.getUsers.path, { id: chore.familyId || 0 })],
      enabled: !!chore.familyId,
    });

    const completedByUser = users.find(u => u.id === chore.lastCompletedBy);
    
    const isDone = chore.lastCompletedAt ? 
      new Date(chore.lastCompletedAt).toDateString() === new Date().toDateString() : false;
    
    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: 100 }}
        whileHover={isDone ? {} : { y: -2 }}
        data-testid={`card-chore-${chore.id}`}
        className={cn(
          "bg-card rounded-[1.5rem] p-4 border-2 shadow-bouncy relative overflow-hidden group transition-all",
          isDone ? "opacity-60 grayscale-[0.2] border-muted bg-muted/5" :
          (isConfirming || isCompleting) ? colors.border : "border-border",
          isCompleting && "opacity-50 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => !isDone && setIsConfirming(true)}
            disabled={isCompleting || isConfirming || isDone}
            data-testid={`button-complete-chore-${chore.id}`}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 flex-shrink-0",
              "border-4",
              isDone ? "border-success bg-success/10 text-success" :
              (isConfirming || isCompleting) ? colors.check :
              `border-muted-foreground/30 text-muted-foreground ${colors.bg}`
            )}
          >
            {isCompleting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Star className="w-6 h-6" />
              </motion.div>
            ) : (
              <Check className={cn("w-6 h-6 transition-opacity", (isConfirming || isCompleting || isDone) ? "opacity-100" : "opacity-0 group-hover:opacity-100")} strokeWidth={4} />
            )}
          </button>

          <div className="flex-1 min-w-0 py-1">
            <h3 className={cn(
              "font-display font-semibold text-lg text-foreground truncate transition-all",
              isDone && "line-through text-muted-foreground opacity-50"
            )}>
              {getEmoji(chore)} {chore.title}
            </h3>
            <div className="flex items-center justify-between gap-2 mt-1">
              <div className="flex items-center gap-2 text-sm font-semibold flex-wrap">
                <span className="flex items-center gap-1 text-accent font-bold bg-accent/10 px-2 py-0.5 rounded-lg" data-testid={`text-chore-points-${chore.id}`}>
                  <Star size={14} className="fill-accent" />
                  {(displayPoints ?? chore.points)} pts
                </span>
                {streakBonusPercent !== undefined && streakBonusPercent > 0 && (
                  <span className="text-[10px] font-bold text-accent bg-accent/5 px-2 py-0.5 rounded-lg">
                    +{streakBonusPercent}% streak
                  </span>
                )}
                {chore.type === 'big' && chore.cooldownHours && (
                  <span className="flex items-center gap-1 text-secondary font-bold bg-secondary/10 px-2 py-0.5 rounded-lg">
                    <Clock size={14} />
                    {chore.cooldownHours}h
                  </span>
                )}
                {(isBox || isPublic) && (
                  <span className="flex items-center gap-1 text-accent font-bold bg-accent/10 px-2 py-0.5 rounded-lg text-xs">
                    <Users size={12} />
                    Anyone
                  </span>
                )}
                {isPublic && !isBox && (
                  <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-lg">
                    +Bonus
                  </span>
                )}
              </div>

              {isDone && completedByUser && (
                <div className="flex items-center gap-1.5 bg-success/10 px-2 py-1 rounded-full border border-success/20">
                  <span className="text-[10px] font-black text-success uppercase italic">
                    - {completedByUser.username}
                  </span>
                  <UserAvatar user={completedByUser} size="sm" className="w-5 h-5 rounded-full border border-white" />
                </div>
              )}

              <AnimatePresence>
                {isConfirming && !isCompleting && (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    data-testid={`button-confirm-chore-${chore.id}`}
                    onClick={() => {
                      onComplete();
                      setIsConfirming(false);
                    }}
                    className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter shadow-lg active:scale-95"
                  >
                    You sure?
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

ChoreCard.displayName = "ChoreCard";
