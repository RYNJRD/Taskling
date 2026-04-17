import { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock3, ShieldCheck, Star, Users, AlertCircle, MessageCircle } from "lucide-react";
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
  status?: string;
  rejectionReason?: string;
}

const TYPE_LABELS: Record<string, string> = {
  daily: "Daily", weekly: "Weekly", monthly: "Monthly", box: "Shared",
};
const TYPE_EMOJIS: Record<string, string> = {
  daily: "☀️", weekly: "📅", monthly: "🗓️", box: "🤝",
};

export const ChoreCard = forwardRef<HTMLDivElement, ChoreCardProps>(
  ({ chore, onComplete, isCompleting, displayPoints, streakBonusPercent, footerNote, stateLabel, actionLabel = "Complete", completed, status, rejectionReason }, ref) => {
    const [confirming, setConfirming] = useState(false);
    const isDone = completed ?? Boolean(chore.lastCompletedAt);
    const isOverdue = stateLabel === "Overdue";
    const isShared = chore.assigneeId === null;
    const isPending = status === "submitted";
    const isRejected = status === "rejected";

    /* Accent colour based on state */
    const accentLine = isRejected
      ? "border-l-orange-500 shadow-orange-100 dark:shadow-orange-950/20"
      : isOverdue
        ? "border-l-rose-400"
        : chore.requiresApproval
          ? "border-l-amber-400"
          : isShared
            ? "border-l-sky-400"
            : "border-l-primary/30";

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        whileHover={!isDone ? { y: -2, boxShadow: "0 8px 24px rgba(139,92,246,0.12)" } : undefined}
        className={cn(
          "rounded-[1.75rem] border-2 border-l-4 bg-card p-4 shadow-sm transition-all",
          isDone || isPending ? "border-border/60 opacity-80" : "border-border",
          isRejected ? "border-orange-500/20 bg-orange-50/30 dark:bg-orange-950/5" : "",
          !isDone && accentLine,
        )}
      >
        <div className="flex gap-3">
          {/* Check button */}
          <motion.button
            whileTap={!isDone && !isCompleting ? { scale: 0.88 } : undefined}
            onClick={() => {
              if (!confirming) setConfirming(true);
              else setConfirming(false);
            }}
            disabled={isDone || isCompleting}
            className={cn(
              "h-12 w-12 shrink-0 rounded-2xl border-2 flex items-center justify-center transition-all",
              isDone
                ? "bg-green-500/15 border-green-500/40 text-green-500"
                : isPending
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500 cursor-default"
                  : confirming
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : isOverdue
                      ? "border-rose-300 bg-rose-50 dark:bg-rose-950/20 text-rose-400"
                      : isRejected
                        ? "border-orange-400 bg-orange-100 dark:bg-orange-900/20 text-orange-600"
                        : "border-primary/30 bg-primary/5 text-primary",
            )}
          >
            {isCompleting ? (
              <Star className="w-5 h-5 animate-spin text-primary" />
            ) : isDone ? (
              <Check className="w-5 h-5" strokeWidth={2.5} />
            ) : isPending ? (
              <Clock3 className="w-5 h-5 animate-pulse" />
            ) : confirming || isRejected ? (
              <Check className="w-5 h-5" strokeWidth={2.5} />
            ) : null}
          </motion.button>

          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                  {TYPE_EMOJIS[chore.type]} {TYPE_LABELS[chore.type] || "Chore"}
                </p>
                <h3 className="font-display text-lg font-bold leading-tight mt-0.5">{chore.title}</h3>
                {chore.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{chore.description}</p>
                )}
              </div>
              {/* Points badge */}
              <div className={cn(
                "rounded-2xl px-3 py-2 text-sm font-bold flex items-center gap-1 shrink-0",
                streakBonusPercent
                  ? "bg-orange-100 dark:bg-orange-950/30 text-orange-600"
                  : "bg-accent/10 text-accent",
              )}>
                <Star className={cn("w-3.5 h-3.5", streakBonusPercent ? "fill-orange-500" : "fill-accent")} />
                {displayPoints ?? chore.points}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {isRejected && (
                <span className="rounded-full bg-orange-500 text-white px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 shadow-sm shadow-orange-500/20 animate-pulse">
                   Needs another pass
                </span>
              )}
              {isPending && (
                <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 text-[11px] font-bold text-amber-600 flex items-center gap-1">
                  Waiting for review
                </span>
              )}
              {isShared && (
                <span className="rounded-full bg-sky-100 dark:bg-sky-950/30 px-2.5 py-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Anyone can help
                </span>
              )}
              {chore.requiresApproval && !isPending && !isRejected && (
                <span className="rounded-full bg-amber-100 dark:bg-amber-950/30 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Needs review
                </span>
              )}
              {isOverdue && !isPending && !isRejected && (
                <span className="rounded-full bg-rose-100 dark:bg-rose-950/30 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Overdue
                </span>
              )}
              {streakBonusPercent ? (
                <span className="rounded-full bg-orange-100 dark:bg-orange-950/30 px-2.5 py-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                  🔥 +{streakBonusPercent}% streak
                </span>
              ) : null}
              {stateLabel && stateLabel !== "Overdue" && !isPending && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <Clock3 className="w-3 h-3" /> {stateLabel}
                </span>
              )}
            </div>

            {isRejected && rejectionReason && (
              <div className="mt-3 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                <p className="text-xs font-bold text-orange-600 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                  <MessageCircle className="w-3 h-3" /> Parent Note
                </p>
                <p className="text-sm text-foreground/80 leading-snug italic">&ldquo;{rejectionReason}&rdquo;</p>
              </div>
            )}

            {footerNote && <p className="text-xs text-muted-foreground/70 mt-2.5">{footerNote}</p>}

            {/* Confirm/complete row */}
            <AnimatePresence initial={false}>
              {!isDone && confirming && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 flex gap-2 overflow-hidden"
                >
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { onComplete(); setConfirming(false); }}
                    className="flex-1 min-h-[48px] rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 active:scale-95 transition-transform"
                  >
                    {actionLabel}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setConfirming(false)}
                    className="rounded-2xl border border-border px-4 py-3 text-sm font-bold text-muted-foreground bg-muted/50"
                  >
                    Not yet
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  },
);

ChoreCard.displayName = "ChoreCard";
