import { useMemo } from "react";
import { addDays, format, isSameDay, startOfToday } from "date-fns";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useParams } from "wouter";
import { Flame, Sparkles, Star, Trophy, Zap, CheckCircle2, TrendingUp } from "lucide-react";
import { calculateStreakMultiplier, getEffectiveStreakForDate, getFamilyTimeZone } from "@shared/streak";
import type { Chore } from "@shared/schema";
import { ChoreCard } from "@/components/ChoreCard";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import {
  useFamilyChores,
  useFamilyLeaderboard,
  useFamilyMonthlyWinners,
  useFamilyOnboarding,
} from "@/hooks/use-families";
import { useCompleteChore } from "@/hooks/use-chores";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
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
                "flex flex-col items-center rounded-2xl py-2.5 px-3 min-w-[46px] transition-all",
                isToday
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:bg-muted/60",
              )}
            >
              <span className="text-[10px] font-bold uppercase">{format(day, "EEE")}</span>
              <span className={cn("text-sm font-bold mt-0.5", isToday && "text-primary-foreground")}>{format(day, "d")}</span>
              {isToday && <div className="w-1 h-1 rounded-full bg-primary-foreground/70 mt-1" />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { familyId } = useParams();
  const id = Number(familyId || 0);
  const { toast } = useToast();
  const { family, currentUser, setCurrentUser } = useStore();
  const { data: chores = [] } = useFamilyChores(id);
  const { data: leaderboard = [] } = useFamilyLeaderboard(id);
  const { data: winners = [] } = useFamilyMonthlyWinners(id);
  const { data: onboarding } = useFamilyOnboarding(id);
  const completeMutation = useCompleteChore();

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
    }
  };

  return (
    <div className="pt-6 px-5 pb-32 min-h-screen">

      {/* ── Hero Card ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 rounded-[2rem] overflow-hidden shadow-lg shadow-primary/15 relative"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-violet-600 to-indigo-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />

        <div className="relative px-4 pt-3 pb-2">
          {/* Top row: avatar + greeting + stars */}
          <div className="flex items-start justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              <UserAvatar user={currentUser} size="sm" className="border-2 border-white/40 shadow-lg" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Welcome back</p>
                <h1 className="font-display text-xl font-bold text-white leading-tight">
                  Hi, {currentUser.username}! 👋
                </h1>
                <p className="text-sm text-white/70 mt-0.5">
                  {rank === 1 ? "🥇 You're leading the family!" : `Rank #${rank || 1} in your family`}
                </p>
              </div>
            </div>
            {/* Stars counter */}
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5 text-right border border-white/20">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">Stars</p>
              <div className="flex items-center gap-1 justify-end">
                <Star className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
                <p className="font-display text-xl font-bold text-white leading-none">{currentUser.points}</p>
              </div>
            </div>
          </div>

          {/* Progress to next rank */}
          <div className="mb-0.5">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {userAbove ? `Progress to rank #${rank - 1}` : "You're #1 — keep it up!"}
              </p>
              <p className="text-[9px] font-bold text-white/70">{progressToNext}%</p>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
          {[
            { icon: Flame, label: "Streak", value: `${currentUser.streak}d`, sub: bonusPercent ? `+${bonusPercent}%` : "Build it!", color: "text-orange-300" },
            { icon: CheckCircle2, label: "This week", value: `${completedThisWeek}`, sub: "chores done", color: "text-green-300" },
            { icon: Zap, label: "Next up", value: `${totalActionable}`, sub: "ready now", color: "text-yellow-300" },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="flex flex-col items-center py-2.5 px-2">
              <Icon className={cn("w-3.5 h-3.5 mb-0.5", color)} />
              <p className="font-display text-base font-bold text-white leading-none">{value}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mt-0.5 truncate w-full text-center">{sub}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Calendar strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-5 rounded-[1.5rem] bg-card border border-border/60 p-4 shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-bold">This week</h2>
          <p className="text-xs font-bold text-muted-foreground">{format(today, "MMMM yyyy")}</p>
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
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Do next</p>
            <h2 className="font-display text-xl font-bold">Today&apos;s chores</h2>
          </div>
          {totalActionable > 0 && (
            <span className="text-xs font-bold bg-primary/10 text-primary rounded-xl px-2.5 py-1">
              {totalActionable} ready
            </span>
          )}
        </div>

        <div className="space-y-3">
          {[...bucketed.overdue, ...bucketed.today].map((chore, i) => (
            <motion.div
              key={chore.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
            >
              <ChoreCard
                chore={chore}
                status={chore.latestSubmissionStatus}
                rejectionReason={chore.rejectionReason}
                onComplete={() => handleComplete(chore)}
                isCompleting={completeMutation.isPending && completeMutation.variables?.id === chore.id}
                displayPoints={chore.type === "daily" && chore.assigneeId === currentUser.id ? Math.ceil(chore.points * multiplier) : chore.points}
                streakBonusPercent={chore.type === "daily" && chore.assigneeId === currentUser.id ? bonusPercent : 0}
                stateLabel={getChoreBucket(chore) === "overdue" ? "Overdue" : undefined}
                footerNote={chore.requiresApproval && !chore.latestSubmissionStatus ? "Stars land after a parent reviews this." : undefined}
                actionLabel={chore.latestSubmissionStatus === "rejected" ? "Try again" : (chore.requiresApproval ? "Submit for review" : "Complete now")}
              />
            </motion.div>
          ))}

          {totalActionable === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[2rem] border-2 border-dashed border-border bg-card p-8 text-center"
            >
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="font-display text-lg font-bold mb-1">You&apos;re all clear!</h3>
              <p className="text-sm text-muted-foreground">No chores pressing right now. Check back later or chat with your family.</p>
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* ── Monthly Spotlight ── */}
      {latestWinner && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="rounded-[2rem] overflow-hidden shadow-lg shadow-accent/10 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-amber-50 to-primary/10 dark:from-accent/10 dark:via-amber-950/20 dark:to-primary/5" />
            <div className="relative p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Monthly spotlight</p>
                  <h2 className="font-display text-lg font-bold">{latestWinner.title}</h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{latestWinner.summary}</p>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-2 uppercase tracking-widest">{latestWinner.monthKey}</p>
            </div>
          </div>
        </motion.section>
      )}

    </div>
  );
}
