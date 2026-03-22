import { useMemo } from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useParams } from "wouter";
import { Flame, Sparkles, Star, Trophy } from "lucide-react";
import { calculateStreakMultiplier, getEffectiveStreakForDate, getFamilyTimeZone } from "@shared/streak";
import type { Chore } from "@shared/schema";
import { ChoreCard } from "@/components/ChoreCard";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import {
  useFamilyActivity,
  useFamilyAchievements,
  useFamilyChores,
  useFamilyLeaderboard,
  useFamilyMonthlyWinners,
  useFamilyOnboarding,
} from "@/hooks/use-families";
import { useCompleteChore } from "@/hooks/use-chores";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

type ChoreBucket = "today" | "upcoming" | "overdue" | "recent";

function getDaysSinceCompleted(chore: Chore) {
  if (!chore.lastCompletedAt) return Number.POSITIVE_INFINITY;
  const lastCompleted = new Date(chore.lastCompletedAt);
  return (Date.now() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24);
}

function getChoreBucket(chore: Chore): ChoreBucket {
  const daysSinceCompleted = getDaysSinceCompleted(chore);
  if (daysSinceCompleted <= 1) return "recent";
  if (chore.type === "daily") return daysSinceCompleted > 1 ? "overdue" : "today";
  if (chore.type === "weekly") return daysSinceCompleted > 7 ? "overdue" : "upcoming";
  if (chore.type === "monthly") return daysSinceCompleted > 30 ? "overdue" : "upcoming";
  return "today";
}

export default function Dashboard() {
  const { familyId } = useParams();
  const id = Number(familyId || 0);
  const { toast } = useToast();
  const { family, currentUser, setCurrentUser } = useStore();
  const { data: chores = [] } = useFamilyChores(id);
  const { data: leaderboard = [] } = useFamilyLeaderboard(id);
  const { data: activity = [] } = useFamilyActivity(id);
  const { data: achievements = [] } = useFamilyAchievements(id);
  const { data: winners = [] } = useFamilyMonthlyWinners(id);
  const { data: onboarding } = useFamilyOnboarding(id);
  const completeMutation = useCompleteChore();

  const today = new Date();
  const weekDays = Array.from({ length: 7 }).map((_, index) => addDays(startOfWeek(today, { weekStartsOn: 1 }), index));

  const myChores = useMemo(
    () => chores.filter((chore) => chore.assigneeId === currentUser?.id || chore.assigneeId === null),
    [chores, currentUser?.id],
  );

  const bucketed = useMemo(() => {
    const initial: Record<ChoreBucket, Chore[]> = { today: [], upcoming: [], overdue: [], recent: [] };
    myChores.forEach((chore) => {
      const bucket = getChoreBucket(chore);
      initial[bucket].push(chore);
    });
    return initial;
  }, [myChores]);

  if (!currentUser) return null;

  const timeZone = getFamilyTimeZone(family || undefined);
  const effectiveStreak = getEffectiveStreakForDate(currentUser, today, timeZone);
  const { bonusPercent, multiplier } = calculateStreakMultiplier(effectiveStreak);
  const rank = leaderboard.findIndex((user) => user.id === currentUser.id) + 1;
  const completedThisWeek = myChores.filter((chore) => getDaysSinceCompleted(chore) <= 7).length;
  const totalActionable = bucketed.today.length + bucketed.overdue.length;
  const checklist = onboarding?.checklist ?? [];
  const latestWinner = winners[0];
  const myAchievements = achievements.filter((achievement) => achievement.userId === currentUser.id).slice(0, 3);

  const handleComplete = async (chore: Chore) => {
    try {
      const result = await completeMutation.mutateAsync({ id: chore.id, userId: currentUser.id, familyId: id });
      if (result.user) {
        setCurrentUser(result.user);
      }

      if (result.submission?.status === "submitted") {
        toast({
          title: "Submitted for review",
          description: `${chore.title} is waiting for a parent or admin to approve it.`,
        });
      } else {
        toast({
          title: `+${result.awardedPoints} stars`,
          description: `Nice work on ${chore.title}.`,
        });
      }

      confetti({
        particleCount: result.submission?.status === "submitted" ? 55 : 110,
        spread: 70,
        origin: { y: 0.8 },
        colors: ["#8b5cf6", "#facc15", "#22c55e", "#ef4444"],
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
      <div className="mb-6 rounded-[2rem] border-2 border-primary/10 bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar user={currentUser} size="md" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Ready to roll</p>
              <h1 className="font-display text-2xl font-bold leading-tight">Hi, {currentUser.username}</h1>
              <p className="text-sm text-muted-foreground">Rank #{rank || 1} in your family this week.</p>
            </div>
          </div>
          <div className="rounded-2xl bg-accent/10 px-4 py-2 text-right">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-accent">Stars</p>
            <p className="font-display text-2xl font-bold">{currentUser.points}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-primary/8 p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Streak</p>
            <p className="mt-1 flex items-center gap-1 text-lg font-bold">
              <Flame className="w-4 h-4 text-orange-500" /> {currentUser.streak} days
            </p>
            <p className="text-xs text-muted-foreground mt-1">{bonusPercent ? `Next daily chores pay +${bonusPercent}%` : "Build it with all daily chores"}</p>
          </div>
          <div className="rounded-2xl bg-success/10 p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-success">This week</p>
            <p className="mt-1 text-lg font-bold">{completedThisWeek} chores</p>
            <p className="text-xs text-muted-foreground mt-1">Every win keeps the family moving.</p>
          </div>
          <div className="rounded-2xl bg-amber-100 p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">Next up</p>
            <p className="mt-1 text-lg font-bold">{totalActionable}</p>
            <p className="text-xs text-muted-foreground mt-1">Best actions you can take today.</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-[2rem] bg-gradient-to-br from-primary/10 via-white to-accent/10 p-4 border-2 border-primary/10">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">This week</p>
            <h2 className="font-display text-xl font-bold">Today&apos;s rhythm</h2>
          </div>
          <p className="text-xs font-bold text-muted-foreground">{format(today, "MMMM yyyy")}</p>
        </div>
        <div className="flex justify-between gap-1">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex-1 rounded-2xl py-2 text-center transition-all",
                  isToday ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground",
                )}
              >
                <div className="text-[10px] font-black uppercase">{format(day, "EEE")}</div>
                <div className="text-sm font-bold">{format(day, "d")}</div>
              </div>
            );
          })}
        </div>
      </div>

      {checklist.some((item) => !item.complete) && currentUser.role === "admin" && (
        <div className="mb-6 rounded-[2rem] border-2 border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-display text-lg font-bold">Quick start checklist</h2>
          </div>
          <div className="space-y-2">
            {checklist.map((item) => (
              <div key={item.key} className="rounded-2xl bg-muted/50 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <span className={cn("text-xs font-black uppercase tracking-[0.18em]", item.complete ? "text-success" : "text-primary")}>
                    {item.complete ? "Done" : "Next"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Do next</p>
            <h2 className="font-display text-xl font-bold">Today&apos;s chores</h2>
          </div>
          <p className="text-sm text-muted-foreground">{bucketed.today.length + bucketed.overdue.length} ready now</p>
        </div>
        <div className="space-y-3">
          {[...bucketed.overdue, ...bucketed.today].map((chore) => (
            <ChoreCard
              key={chore.id}
              chore={chore}
              onComplete={() => handleComplete(chore)}
              isCompleting={completeMutation.isPending && completeMutation.variables?.id === chore.id}
              displayPoints={chore.type === "daily" && chore.assigneeId === currentUser.id ? Math.ceil(chore.points * multiplier) : chore.points}
              streakBonusPercent={chore.type === "daily" && chore.assigneeId === currentUser.id ? bonusPercent : 0}
              stateLabel={getChoreBucket(chore) === "overdue" ? "Overdue" : "Ready today"}
              footerNote={chore.requiresApproval ? "Stars land after review." : "Stars land the moment you finish it."}
              actionLabel={chore.requiresApproval ? "Submit now" : "Complete now"}
            />
          ))}
          {bucketed.today.length + bucketed.overdue.length === 0 && (
            <div className="rounded-[2rem] border-2 border-dashed border-border bg-card p-6 text-center">
              <Trophy className="w-10 h-10 mx-auto text-accent mb-3" />
              <h3 className="font-display text-lg font-bold mb-1">You&apos;re clear for now</h3>
              <p className="text-sm text-muted-foreground">No chores are pressing right now. Check the upcoming list or chat.</p>
            </div>
          )}
        </div>
      </section>

      <section className="mb-8">
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-[2rem] border-2 border-border bg-card p-4 shadow-sm">
            <h2 className="font-display text-lg font-bold mb-3">Upcoming and shared</h2>
            <div className="space-y-3">
              {bucketed.upcoming.slice(0, 3).map((chore) => (
                <ChoreCard
                  key={chore.id}
                  chore={chore}
                  onComplete={() => handleComplete(chore)}
                  isCompleting={completeMutation.isPending && completeMutation.variables?.id === chore.id}
                  stateLabel="Coming up"
                  footerNote="Keep the momentum going before it becomes urgent."
                />
              ))}
              {bucketed.upcoming.length === 0 && <p className="text-sm text-muted-foreground">Nothing upcoming right now.</p>}
            </div>
          </div>

          <div className="rounded-[2rem] border-2 border-border bg-card p-4 shadow-sm">
            <h2 className="font-display text-lg font-bold mb-3">Recently finished</h2>
            <div className="space-y-3">
              {bucketed.recent.slice(0, 3).map((chore) => (
                <ChoreCard
                  key={chore.id}
                  chore={chore}
                  onComplete={() => undefined}
                  isCompleting={false}
                  completed
                  stateLabel="Recently done"
                  footerNote={`Last wrapped up ${format(new Date(chore.lastCompletedAt || Date.now()), "EEE HH:mm")}.`}
                />
              ))}
              {bucketed.recent.length === 0 && <p className="text-sm text-muted-foreground">Fresh wins will show up here.</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8 grid gap-4">
        <div className="rounded-[2rem] border-2 border-border bg-card p-4 shadow-sm">
          <h2 className="font-display text-lg font-bold mb-3">Fresh family activity</h2>
          <div className="space-y-2">
            {activity.slice(0, 5).map((event) => (
              <div key={event.id} className="rounded-2xl bg-muted/50 px-3 py-3">
                <p className="font-bold text-sm">{event.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{event.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border-2 border-border bg-card p-4 shadow-sm">
          <h2 className="font-display text-lg font-bold mb-3">Your latest badges</h2>
          <div className="space-y-2">
            {myAchievements.length > 0 ? (
              myAchievements.map((achievement) => (
                <div key={achievement.id} className="rounded-2xl bg-primary/8 px-3 py-3">
                  <p className="font-bold text-sm">
                    {achievement.emoji} {achievement.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Your first badge unlocks after your first completed chore.</p>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border-2 border-border bg-card p-4 shadow-sm">
          <h2 className="font-display text-lg font-bold mb-3">Monthly spotlight</h2>
          {latestWinner ? (
            <div className="rounded-2xl bg-gradient-to-br from-accent/15 to-primary/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">{latestWinner.monthKey}</p>
              <p className="font-display text-xl font-bold mt-1">{latestWinner.title}</p>
              <p className="text-sm text-muted-foreground mt-2">{latestWinner.summary}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Monthly winners appear once your family has a full month of history.</p>
          )}
        </div>
      </section>
    </div>
  );
}
