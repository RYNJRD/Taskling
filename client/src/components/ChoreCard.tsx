import { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock3, ShieldCheck, Star, Users } from "lucide-react";
import type { Chore } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ChoreCardProps {
  chore: Chore;
  onComplete: () => void;
  isCompleting: boolean;
  displayPoints?: number;
  streakBonusPercent?: number;
  footerNote?: string;
  stateLabel?: string;
  actionLabel?: string;
  completed?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  box: "Shared",
};

const TYPE_EMOJIS: Record<string, string> = {
  daily: "☀️",
  weekly: "📅",
  monthly: "🗓️",
  box: "🤝",
};

export const ChoreCard = forwardRef<HTMLDivElement, ChoreCardProps>(
  (
    {
      chore,
      onComplete,
      isCompleting,
      displayPoints,
      streakBonusPercent,
      footerNote,
      stateLabel,
      actionLabel = "Complete",
      completed,
    },
    ref,
  ) => {
    const [confirming, setConfirming] = useState(false);
    const isDone = completed ?? Boolean(chore.lastCompletedAt);

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className={cn(
          "rounded-[1.75rem] border-2 bg-card p-4 shadow-sm",
          isDone ? "border-border/60 opacity-75" : "border-border",
        )}
      >
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (!confirming) {
                setConfirming(true);
                return;
              }
              onComplete();
              setConfirming(false);
            }}
            disabled={isDone || isCompleting}
            className={cn(
              "h-12 w-12 shrink-0 rounded-2xl border-2 flex items-center justify-center transition-all",
              isDone
                ? "bg-success/10 border-success/30 text-success"
                : confirming
                  ? "border-primary bg-primary/10 text-primary hover:scale-[1.02]"
                  : "border-red-400 bg-red-50 dark:bg-red-950/20 hover:scale-[1.02]",
            )}
          >
            {isCompleting
              ? <Star className="w-5 h-5 animate-spin text-primary" />
              : isDone || confirming
                ? <Check className="w-5 h-5" />
                : null}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  {TYPE_EMOJIS[chore.type]} {TYPE_LABELS[chore.type] || "Chore"}
                </p>
                <h3 className="font-display text-lg font-bold leading-tight">{chore.title}</h3>
                {chore.description && <p className="text-sm text-muted-foreground mt-1">{chore.description}</p>}
              </div>
              <div className="rounded-2xl bg-accent/10 px-3 py-2 text-sm font-black text-accent flex items-center gap-1">
                <Star className="w-4 h-4 fill-accent" />
                {displayPoints ?? chore.points}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {chore.assigneeId === null && (
                <span className="rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-bold text-primary flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Anyone can help
                </span>
              )}
              {chore.requiresApproval && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Needs review
                </span>
              )}
              {streakBonusPercent ? (
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                  +{streakBonusPercent}% streak
                </span>
              ) : null}
              {stateLabel ? (
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <Clock3 className="w-3 h-3" />
                  {stateLabel}
                </span>
              ) : null}
            </div>

            {footerNote ? <p className="text-xs text-muted-foreground mt-3">{footerNote}</p> : null}

            <AnimatePresence initial={false}>
              {!isDone && confirming ? (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      onComplete();
                      setConfirming(false);
                    }}
                    className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground"
                  >
                    {actionLabel}
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="rounded-2xl border border-border px-4 py-3 text-sm font-bold text-muted-foreground"
                  >
                    Not yet
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  },
);

ChoreCard.displayName = "ChoreCard";
