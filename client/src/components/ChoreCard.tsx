import { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock3, ShieldCheck, Star, Users, AlertCircle, MessageCircle } from "lucide-react";
import type { Chore } from "../../../shared/schema";
import { cn } from "../lib/utils";

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

    /* Accent glow based on state */
    const accentBorder = isRejected
      ? 'rgba(249, 115, 22, 0.3)'
      : isOverdue
        ? 'rgba(244, 63, 94, 0.3)'
        : chore.requiresApproval
          ? 'rgba(245, 158, 11, 0.3)'
          : isShared
            ? 'rgba(56, 189, 248, 0.3)'
            : 'rgba(var(--glow-primary), 0.15)';

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        whileHover={!isDone ? { y: -2 } : undefined}
        className={cn(
          "rounded-[1.75rem] p-4 transition-all duration-300 relative overflow-visible",
          isDone || isPending ? "opacity-70" : "",
        )}
        style={{
          background: isRejected ? 'rgba(249, 115, 22, 0.05)' : 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${accentBorder}`,
          borderLeft: `3px solid ${accentBorder}`,
          boxShadow: !isDone && !isPending ? `0 0 12px ${accentBorder}` : 'none',
          cursor: !isDone && !isCompleting && !isPending ? 'pointer' : 'default',
        }}
        onClick={() => {
          if (isDone || isCompleting || isPending) return;
          if (!confirming) setConfirming(true);
          else setConfirming(false);
        }}
      >
        {/* Outer card green border-draw when completing */}
        {isCompleting && (
          <>
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none" viewBox="0 0 200 100" fill="none">
              <motion.rect
                x="1" y="1" width="198" height="98" rx="14"
                fill="none"
                stroke="#4ade80"
                strokeWidth="2"
                strokeLinecap="round"
                pathLength={100}
                initial={{ strokeDasharray: '50 50', strokeDashoffset: 50, opacity: 0 }}
                animate={{ strokeDashoffset: 0, opacity: 1 }}
                transition={{ strokeDashoffset: { delay: 0.5, duration: 0.55, ease: "easeInOut" }, opacity: { delay: 0.45, duration: 0.05 } }}
              />
            </svg>
            {/* Outer green pulse */}
            <motion.div
              className="absolute inset-[-2px] rounded-[1.75rem] pointer-events-none z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0.6, 0] }}
              transition={{ duration: 1.4, times: [0, 0.73, 0.8, 1], ease: "easeOut" }}
              style={{ boxShadow: '0 0 24px rgba(74, 222, 128, 0.5), inset 0 0 20px rgba(74, 222, 128, 0.15)' }}
            />
          </>
        )}
        <div className="flex gap-3">
          {/* Check button */}
          <motion.button
            whileTap={!isDone && !isCompleting ? { scale: 0.88 } : undefined}
            onClick={(e) => {
              e.stopPropagation();
              if (!confirming) setConfirming(true);
              else setConfirming(false);
            }}
            disabled={isDone || isCompleting}
            className={cn(
              "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center transition-all duration-300 relative overflow-visible",
            )}
            style={{
              background: isDone
                ? 'rgba(74, 222, 128, 0.1)' 
                : isPending
                  ? 'rgba(245, 158, 11, 0.1)'
                  : confirming
                    ? 'linear-gradient(135deg, hsl(262, 83%, 58%), hsl(280, 75%, 60%))'
                    : isOverdue
                      ? 'rgba(244, 63, 94, 0.1)'
                      : isRejected
                        ? 'rgba(249, 115, 22, 0.1)'
                        : 'rgba(var(--glow-primary), 0.08)',
              border: `1px solid ${
                isDone ? 'rgba(74, 222, 128, 0.3)' :
                isPending ? 'rgba(245, 158, 11, 0.2)' :
                confirming ? 'rgba(var(--glow-primary), 0.5)' :
                isOverdue ? 'rgba(244, 63, 94, 0.2)' :
                isRejected ? 'rgba(249, 115, 22, 0.3)' :
                'rgba(var(--glow-primary), 0.15)'
              }`,
              boxShadow: confirming ? '0 0 16px rgba(var(--glow-primary), 0.4)' : 'none',
              color: isDone ? 'rgb(74, 222, 128)' :
                     isPending ? 'rgb(245, 158, 11)' :
                     confirming ? 'white' :
                     isOverdue ? 'rgb(244, 63, 94)' :
                     isRejected ? 'rgb(249, 115, 22)' :
                     'hsl(262, 83%, 65%)',
            }}
          >
            {isCompleting ? (
              <>
                <motion.div
                  initial={{ color: 'hsl(262, 83%, 65%)' }}
                  animate={{ color: ['hsl(262, 83%, 65%)', 'hsl(262, 83%, 65%)', '#4ade80'] }}
                  transition={{ duration: 0.6, times: [0, 0.8, 1], delay: 0.45 }}
                  style={{ zIndex: 2 }}
                >
                  <Star className="w-5 h-5 animate-spin" />
                </motion.div>
                {/* SVG border draw: two green paths from top-center */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 48 48" fill="none" style={{ zIndex: 3 }}>
                  {/* CW path: top-center → right → bottom-center */}
                  <motion.path
                    d="M 24,2 L 32,2 A 14,14 0 0 1 46,16 L 46,32 A 14,14 0 0 1 32,46 L 24,46"
                    stroke="#4ade80"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ pathLength: { delay: 0.5, duration: 0.55, ease: "easeInOut" }, opacity: { delay: 0.45, duration: 0.05 } }}
                  />
                  {/* CCW path: top-center → left → bottom-center */}
                  <motion.path
                    d="M 24,2 L 16,2 A 14,14 0 0 0 2,16 L 2,32 A 14,14 0 0 0 16,46 L 24,46"
                    stroke="#4ade80"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ pathLength: { delay: 0.5, duration: 0.55, ease: "easeInOut" }, opacity: { delay: 0.45, duration: 0.05 } }}
                  />
                </svg>
                {/* Green pulse when paths meet */}
                <motion.div
                  className="absolute inset-[-3px] rounded-2xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 0.7, 0] }}
                  transition={{ duration: 1.4, times: [0, 0.73, 0.8, 1], ease: "easeOut" }}
                  style={{ boxShadow: '0 0 18px rgba(74, 222, 128, 0.7), inset 0 0 14px rgba(74, 222, 128, 0.4)', border: '2px solid rgba(74, 222, 128, 0.5)' }}
                />
                {/* Inner green illumination */}
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 0.5, 0.2] }}
                  transition={{ duration: 1.4, times: [0, 0.73, 0.82, 1], ease: "easeOut" }}
                  style={{ background: 'radial-gradient(circle, rgba(74, 222, 128, 0.35) 0%, rgba(74, 222, 128, 0.08) 70%, transparent 100%)' }}
                />
              </>
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
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                  {TYPE_EMOJIS[chore.type]} {TYPE_LABELS[chore.type] || "Chore"}
                </p>
                <h3 className="font-display text-lg font-bold leading-tight mt-0.5 text-white">{chore.title}</h3>
                {chore.description && (
                  <p className="text-sm text-white/40 mt-0.5 leading-snug">{chore.description}</p>
                )}
              </div>
              {/* Points badge */}
              <div className={cn(
                "rounded-2xl px-3 py-2 text-sm font-bold flex items-center gap-1 shrink-0",
              )} style={{
                background: streakBonusPercent ? 'rgba(249, 115, 22, 0.1)' : 'rgba(var(--glow-accent), 0.08)',
                color: streakBonusPercent ? 'rgb(251, 146, 60)' : 'rgb(250, 204, 21)',
                border: `1px solid ${streakBonusPercent ? 'rgba(249, 115, 22, 0.2)' : 'rgba(var(--glow-accent), 0.15)'}`,
              }}>
                <Star className={cn("w-3.5 h-3.5", streakBonusPercent ? "fill-orange-400" : "fill-amber-400")} />
                {displayPoints ?? chore.points}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {isRejected && (
                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 animate-pulse"
                  style={{ background: 'rgba(249, 115, 22, 0.2)', color: 'rgb(251, 146, 60)', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                   Needs another pass
                </span>
              )}
              {isPending && (
                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold flex items-center gap-1"
                  style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'rgb(251, 191, 36)' }}>
                  Waiting for review
                </span>
              )}
              {isShared && (
                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold flex items-center gap-1"
                  style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'rgb(125, 211, 252)' }}>
                  <Users className="w-3 h-3" /> Anyone can help
                </span>
              )}
              {chore.requiresApproval && !isPending && !isRejected && (
                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold flex items-center gap-1"
                  style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'rgb(251, 191, 36)' }}>
                  <ShieldCheck className="w-3 h-3" /> Needs review
                </span>
              )}
              {isOverdue && !isPending && !isRejected && (
                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold flex items-center gap-1"
                  style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'rgb(251, 113, 133)' }}>
                  <AlertCircle className="w-3 h-3" /> Overdue
                </span>
              )}
              {streakBonusPercent ? (
                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'rgb(251, 146, 60)' }}>
                  🔥 +{streakBonusPercent}% streak
                </span>
              ) : null}
              {stateLabel && stateLabel !== "Overdue" && !isPending && (
                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold flex items-center gap-1"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.4)' }}>
                  <Clock3 className="w-3 h-3" /> {stateLabel}
                </span>
              )}
            </div>

            {isRejected && rejectionReason && (
              <div className="mt-3 p-3 rounded-2xl"
                style={{ background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.15)' }}>
                <p className="text-xs font-bold mb-1 flex items-center gap-1.5 uppercase tracking-wider" style={{ color: 'rgb(251, 146, 60)' }}>
                  <MessageCircle className="w-3 h-3" /> Parent Note
                </p>
                <p className="text-sm text-white/60 leading-snug italic">&ldquo;{rejectionReason}&rdquo;</p>
              </div>
            )}

            {footerNote && <p className="text-xs text-white/25 mt-2.5">{footerNote}</p>}

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
                    className="flex-1 min-h-[48px] rounded-2xl px-4 py-3 text-sm font-bold text-white btn-neon-primary active:scale-95 transition-transform"
                  >
                    {actionLabel}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setConfirming(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-bold btn-glass text-white/50"
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
