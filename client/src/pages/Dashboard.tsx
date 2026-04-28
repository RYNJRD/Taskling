import { useMemo, useRef, useEffect, useState as useStateReact } from "react";
import { addDays, format, isSameDay, startOfToday } from "date-fns";
import confetti from "canvas-confetti";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useParams } from "wouter";
import { Flame, Sparkles, Star, Trophy, Zap, CheckCircle2, TrendingUp, Menu, Shield } from "lucide-react";
import { useLocation as useWouterLocation } from "wouter";
import { calculateStreakMultiplier, getEffectiveStreakForDate, getFamilyTimeZone } from "../../../shared/streak";
import type { Chore } from "../../../shared/schema";
import { ChoreCard } from "../components/ChoreCard";
import { UserAvatar } from "../components/UserAvatar";
import { useToast } from "../hooks/use-toast";
import {
  useFamilyChores,
  useFamilyLeaderboard,
  useFamilyMonthlyWinners,
  useFamilyOnboarding,
} from "../hooks/use-families";
import { useCompleteChore } from "../hooks/use-chores";
import { useStore } from "../store/useStore";
import { cn } from "../lib/utils";
import ParentDashboard from "./ParentDashboard";

type ChoreBucket = "today" | "upcoming" | "overdue" | "recent" | "pending";

function getDaysSinceCompleted(chore: Chore) {
  if (!chore.lastCompletedAt) return Number.POSITIVE_INFINITY;
  return (Date.now() - new Date(chore.lastCompletedAt).getTime()) / (1000 * 60 * 60 * 24);
}

function getChoreBucket(chore: Chore & { latestSubmissionStatus?: string }): ChoreBucket {
  if (chore.latestSubmissionStatus === "submitted") return "pending";
  const d = getDaysSinceCompleted(chore);
  if (d <= 1 && chore.latestSubmissionStatus !== "rejected") return "recent";
  if (chore.type === "daily") return d > 1 ? "overdue" : "today";
  if (chore.type === "weekly") return d > 7 ? "overdue" : "upcoming";
  if (chore.type === "monthly") return d > 30 ? "overdue" : "upcoming";
  return "today";
}

/* ─── Calendar strip (14 days centred on today) ─── */
function CalendarStrip() {
  const today = startOfToday();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 3));

  return (
    <div className="overflow-x-auto scrollbar-none -mx-5 px-5">
      <div className="flex gap-2 pb-1" style={{ minWidth: "max-content" }}>
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <motion.div
              key={day.toISOString()}
              whileTap={{ scale: 0.92 }}
              className={cn(
                "flex flex-col items-center rounded-2xl py-2.5 px-3 min-w-[46px] transition-all duration-300",
                isToday
                  ? "text-white"
                  : "text-slate-400 dark:text-white/60 hover:bg-white/5 dark:hover:bg-white/5",
              )}
              style={isToday ? {
                background: 'linear-gradient(135deg, hsl(262, 83%, 58%), hsl(280, 75%, 60%))',
                boxShadow: '0 0 16px rgba(var(--glow-primary), 0.4)',
              } : undefined}
            >
              <span className="text-[10px] font-bold uppercase">{format(day, "EEE")}</span>
              <span className={cn("text-base font-bold mt-0.5", isToday && "text-white")}>{format(day, "d")}</span>
              {isToday && <div className="w-1 h-1 rounded-full bg-white/70 mt-1" />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Monthly Spotlight with animated trophy and confetti ─── */
function MonthlySpotlight({ winner }: { winner: { title: string; summary: string; monthKey: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [hasFired, setHasFired] = useStateReact(false);

  useEffect(() => {
    if (isInView && !hasFired) {
      setHasFired(true);
      const timer = setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.7, x: 0.5 },
          colors: ["#FFD700", "#FDB931", "#FF8C00", "#F59E0B"],
          gravity: 1.2,
        });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isInView, hasFired]);

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="rounded-[2rem] overflow-hidden relative" style={{
        border: '2px solid transparent',
        backgroundClip: 'padding-box',
      }}>
        {/* Neon gold worm ring */}
        <div className="absolute inset-0 rounded-[2rem] z-0 overflow-hidden">
          <div className="absolute inset-[-2px] rounded-[2rem]" style={{
            background: 'conic-gradient(from 0deg, rgba(255, 215, 0, 0.6), rgba(245, 158, 11, 0.1), rgba(255, 215, 0, 0.6), rgba(245, 158, 11, 0.1), rgba(255, 215, 0, 0.6))',
            animation: isInView ? 'spin 3s linear infinite' : 'none',
          }} />
          <div className="absolute inset-[2px] rounded-[1.85rem]" style={{
            background: 'var(--glass-bg)',
          }} />
        </div>

        <div className="absolute inset-[2px] rounded-[1.85rem] bg-gradient-to-br from-accent/15 via-transparent to-primary/5 z-[1]" />
        <div className="relative p-5 z-[2]">
          <div className="flex flex-col items-center text-center gap-2 mb-3">
            {/* Trophy rising from top */}
            <motion.div
              initial={{ y: -40, opacity: 0, scale: 0.6 }}
              animate={isInView ? { y: 0, opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 15 }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255, 215, 0, 0.15)', boxShadow: isInView ? '0 0 24px rgba(255, 215, 0, 0.3)' : 'none' }}
            >
              <Trophy className="w-8 h-8 text-amber-400" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))' }} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400" style={{ textShadow: '0 0 8px rgba(255, 215, 0, 0.3)' }}>Monthly spotlight</p>
              <h2 className="font-display text-lg font-bold text-foreground" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>{winner.title}</h2>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.7 }}
          >
            <p className="text-sm text-muted-foreground leading-relaxed text-center" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{winner.summary}</p>
            <p className="text-[10px] font-bold text-muted-foreground/60 mt-2 uppercase tracking-widest text-center">{winner.monthKey}</p>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}


export default function Dashboard() {
  const { familyId } = useParams();
  const id = Number(familyId || 0);
  const { toast } = useToast();
  const { family, currentUser, setCurrentUser, setIsDrawerOpen } = useStore();
  const { data: chores = [] } = useFamilyChores(id);
  const { data: leaderboard = [] } = useFamilyLeaderboard(id);
  const { data: winners = [] } = useFamilyMonthlyWinners(id);
  const { data: onboarding } = useFamilyOnboarding(id);
  const completeMutation = useCompleteChore();
  const [, navigate] = useWouterLocation();
  const [completingId, setCompletingId] = useStateReact<number | null>(null);

  const today = new Date();

  const myChores = useMemo(
    () => chores.filter((c) => c.assigneeId === currentUser?.id || c.assigneeId === null),
    [chores, currentUser?.id],
  );

  const bucketed = useMemo(() => {
    const b: Record<ChoreBucket, (Chore & { latestSubmissionStatus?: string; rejectionReason?: string })[]> = { 
      today: [], upcoming: [], overdue: [], recent: [], pending: [] 
    };
    myChores.forEach((c) => b[getChoreBucket(c)].push(c));
    return b;
  }, [myChores]);

  if (!currentUser) return null;
  if (currentUser.role === "admin") return <ParentDashboard />;

  const timeZone = getFamilyTimeZone(family || undefined);
  const effectiveStreak = getEffectiveStreakForDate(currentUser, today, timeZone);
  const { bonusPercent, multiplier } = calculateStreakMultiplier(effectiveStreak);
  const sortedBoard = [...leaderboard].sort((a, b) => b.points - a.points);
  const rank = sortedBoard.findIndex((u) => u.id === currentUser.id) + 1;
  const userAbove = rank > 1 ? sortedBoard[rank - 2] : null;
  const progressToNext = userAbove
    ? Math.min(99, Math.round((currentUser.points / Math.max(userAbove.points, 1)) * 100))
    : 100;
  const completedThisWeek = myChores.filter((c) => getDaysSinceCompleted(c) <= 7).length;
  const totalActionable = bucketed.today.length + bucketed.overdue.length;
  const checklist = onboarding?.checklist ?? [];
  const latestWinner = winners[0];

  const handleComplete = async (chore: Chore) => {
    setCompletingId(chore.id);

    // Wait for the green bloom animation (1.2s) before removing from screen
    setTimeout(async () => {
      try {
        const result = await completeMutation.mutateAsync({ id: chore.id, userId: currentUser.id, familyId: id });
        if (result.user) setCurrentUser(result.user);

        if (result.submission?.status === "submitted") {
          toast({ title: "Submitted for review ✓", description: `${chore.title} is waiting for approval.` });
        } else {
          toast({ title: `+${result.awardedPoints} stars ⭐`, description: `Great job on ${chore.title}!` });
        }

        confetti({
          particleCount: result.submission?.status === "submitted" ? 55 : 120,
          spread: 80,
          origin: { y: 0.75 },
          colors: ["#8b5cf6", "#facc15", "#22c55e", "#f97316"],
        });
      } catch (error) {
        toast({
          title: "Could not complete chore",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setCompletingId(null);
      }
    }, 1200);
  };

  return (
    <div className="pt-[max(1.5rem,env(safe-area-inset-top))] px-5 pb-32 min-h-screen bg-tab-home">

      {/* ── Hero Card V2.0 ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 rounded-[2rem] overflow-hidden relative glass-card"
      >
        <div className="relative px-5 pt-5 pb-4">
          {/* Top row: avatar + greeting + menu */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <UserAvatar user={currentUser} size="md" className="border-2 border-white/20 shadow-xl" />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-[#1a1a2e]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Family Member</p>
                <h1 className="font-display text-xl font-bold text-white leading-tight">
                  Hi, {currentUser.username}! 👋
                </h1>
              </div>
            </div>
            {/* Stars counter & Menu */}
            <div className="flex items-center gap-2">
              <div className="rounded-2xl px-3.5 py-2 flex items-center gap-2 bg-white/5 border border-white/10 shadow-inner">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <p className="font-display text-lg font-bold text-white leading-none">{currentUser.points}</p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all duration-300 active:scale-95 shadow-sm"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Rank info */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Trophy className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-sm font-medium text-white/80">
              {rank === 1 ? "🥇 Leading the family board!" : `Ranked #${rank} in your family`}
            </p>
          </div>

          {/* Progress to next rank */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                {userAbove ? `On the heels of #${rank - 1}` : "Top of the board!"}
              </p>
              <p className="text-[10px] font-bold text-white/60">{progressToNext}%</p>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, hsl(262, 83%, 65%), hsl(280, 75%, 60%))' }}
              />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative grid grid-cols-3 divide-x divide-white/5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { icon: Flame, label: "Streak", value: `${currentUser.streak}d`, sub: bonusPercent ? `+${bonusPercent}%` : "Build it!", color: "text-orange-300" },
            { icon: CheckCircle2, label: "This week", value: `${completedThisWeek}`, sub: "chores done", color: "text-green-300" },
            { icon: Zap, label: "Next up", value: `${totalActionable}`, sub: "ready now", color: "text-yellow-300" },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="flex flex-col items-center py-2.5 px-2">
              <Icon className={cn("w-3.5 h-3.5 mb-0.5", color)} style={{ filter: 'drop-shadow(0 0 3px currentColor)' }} />
              <p className="font-display text-base font-bold text-white leading-none" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{value}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/70 mt-0.5 truncate w-full text-center" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>{sub}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Calendar strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-5 rounded-[1.5rem] p-4 glass-card"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-bold text-foreground" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>This week</h2>
          <p className="text-xs font-bold text-foreground/60">{format(today, "MMMM yyyy")}</p>
        </div>
        <CalendarStrip />
      </motion.div>

      {/* ── Onboarding checklist (admin only) ── */}
      {checklist.some((item) => !item.complete) && currentUser.role === "admin" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-5 rounded-[1.5rem] border-2 border-primary/20 bg-primary/5 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-display text-base font-bold">Quick start</h2>
          </div>
          <div className="space-y-2">
            {checklist.map((item) => (
              <div key={item.key} className="rounded-2xl bg-background/60 px-3 py-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest shrink-0", item.complete ? "text-green-500" : "text-primary")}>
                  {item.complete ? "✓ Done" : "Next"}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Pending Review ── */}
      {bucketed.pending.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">Wait for it</p>
              <h2 className="font-display text-base font-bold text-foreground/80">Pending Review</h2>
            </div>
          </div>
          <div className="space-y-3">
            {bucketed.pending.map((chore) => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                status={chore.latestSubmissionStatus}
                actionLabel="In Review"
                onComplete={() => {}}
                isCompleting={false}
                completed={false}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Today's chores ── */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary text-glow-primary">Do next</p>
            <h2 className="font-display text-xl font-bold text-white">Today&apos;s chores</h2>
          </div>
          {totalActionable > 0 && (
            <span className="text-xs font-bold rounded-xl px-2.5 py-1" style={{ background: 'rgba(var(--glow-primary), 0.1)', color: 'hsl(262, 83%, 65%)' }}>
              {totalActionable} ready
            </span>
          )}
        </div>

        <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {[...bucketed.overdue, ...bucketed.today].map((chore, i) => (
            <motion.div
              key={chore.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, filter: 'brightness(1.3)', transition: { duration: 0.4, ease: 'easeOut' } }}
              transition={{ delay: 0.3 + i * 0.06 }}
              layout
            >
              <ChoreCard
                chore={chore}
                status={chore.latestSubmissionStatus}
                rejectionReason={chore.rejectionReason}
                completed={false}
                onComplete={() => handleComplete(chore)}
                isCompleting={completingId === chore.id || (completeMutation.isPending && completeMutation.variables?.id === chore.id)}
                displayPoints={chore.type === "daily" && chore.assigneeId === currentUser.id ? Math.ceil(chore.points * multiplier) : chore.points}
                streakBonusPercent={chore.type === "daily" && chore.assigneeId === currentUser.id ? bonusPercent : 0}
                stateLabel={getChoreBucket(chore) === "overdue" ? "Overdue" : undefined}
                footerNote={chore.requiresApproval && !chore.latestSubmissionStatus ? "Stars land after a parent reviews this." : undefined}
                actionLabel={chore.latestSubmissionStatus === "rejected" ? "Try again" : (chore.requiresApproval ? "Submit for review" : "Complete now")}
              />
            </motion.div>
          ))}
        </AnimatePresence>

          {totalActionable === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[2rem] p-8 text-center glass-card" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}
            >
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="font-display text-lg font-bold mb-1 text-white">You&apos;re all clear!</h3>
              <p className="text-sm text-white/40">No chores pressing right now. Check back later or chat with your family.</p>
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* ── Monthly Spotlight ── */}
      {latestWinner && (
        <MonthlySpotlight winner={latestWinner} />
      )}

    </div>
  );
}
