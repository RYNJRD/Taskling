import { useParams } from "wouter";
import { useStore } from "@/store/useStore";
import { useFamilyChores, useFamilyLeaderboard } from "@/hooks/use-families";
import { useCompleteChore } from "@/hooks/use-chores";
import { ChoreCard } from "@/components/ChoreCard";
import { Star, Flame, ArrowUpDown, Trophy, Info } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import confetti from "canvas-confetti";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { Chore } from "@shared/schema";
import { calculateStreakMultiplier, getEffectiveStreakForDate, getFamilyTimeZone } from "@shared/streak";

type ChoreCategory = 'daily' | 'weekly' | 'monthly' | 'box';
type SortMode = 'category' | 'points-high' | 'points-low';

const CATEGORY_CONFIG: Record<ChoreCategory, { label: string; color: string; bgColor: string; borderColor: string }> = {
  daily: { label: "Daily", color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/20" },
  weekly: { label: "Weekly", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  monthly: { label: "Monthly", color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
  box: { label: "Open Chore", color: "text-accent", bgColor: "bg-accent/10", borderColor: "border-accent/20" },
};

const CATEGORY_ORDER: ChoreCategory[] = ['daily', 'weekly', 'monthly', 'box'];

export default function Dashboard() {
  const { familyId } = useParams();
  const id = parseInt(familyId || "0");
  const { family, currentUser, setCurrentUser } = useStore();
  
  const { data: chores } = useFamilyChores(id);
  const { data: leaderboard } = useFamilyLeaderboard(id);
  const completeMutation = useCompleteChore();

  const [sortMode, setSortMode] = useState<SortMode>('category');
  const [showBonusInfo, setShowBonusInfo] = useState(false);

  if (!currentUser || !chores || !leaderboard) return null;

  const today = new Date();
  const timeZone = getFamilyTimeZone(family || undefined);
  const effectiveStreak = getEffectiveStreakForDate(currentUser, today, timeZone);
  const { bonusPercent: streakBonusPercent, multiplier: streakMultiplier } = calculateStreakMultiplier(effectiveStreak);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const handleComplete = async (choreId: number) => {
    try {
      const result = await completeMutation.mutateAsync({ id: choreId, userId: currentUser.id, familyId: id });
      
      if (result.user) {
        setCurrentUser(result.user);
      }
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#8b5cf6', '#facc15', '#22c55e', '#ef4444']
      });
    } catch (error) {
      console.error(error);
    }
  };

  const normalizeType = (type: string): ChoreCategory => {
    if (type === 'big') return 'daily';
    if (CATEGORY_ORDER.includes(type as ChoreCategory)) return type as ChoreCategory;
    return 'daily';
  };

  const myChores = chores.filter(c => 
    c.assigneeId === currentUser.id || c.type === 'box' || c.assigneeId === null
  );

  const dailyChores = myChores.filter(c => normalizeType(c.type) === 'daily' && c.assigneeId === currentUser.id);
  const dailyDoneCount = dailyChores.filter(c => {
    if (!c.lastCompletedAt) return false;
    return new Date(c.lastCompletedAt).toDateString() === today.toDateString();
  }).length;
  const allDailyDone = dailyChores.length > 0 && dailyDoneCount === dailyChores.length;

  const DAILY_STREAK_BONUS_PERCENT = 20;

  const sortedChores = (() => {
    if (sortMode === 'points-high') {
      return [...myChores].sort((a, b) => b.points - a.points);
    }
    if (sortMode === 'points-low') {
      return [...myChores].sort((a, b) => a.points - b.points);
    }
    return myChores;
  })();

  const groupedChores = (() => {
    if (sortMode !== 'category') return null;
    const groups: Record<ChoreCategory, Chore[]> = { daily: [], weekly: [], monthly: [], box: [] };
    myChores.forEach(c => {
      const cat = normalizeType(c.type);
      groups[cat].push(c);
    });
    return groups;
  })();

  const cycleSortMode = () => {
    if (sortMode === 'category') setSortMode('points-high');
    else if (sortMode === 'points-high') setSortMode('points-low');
    else setSortMode('category');
  };

  const sortLabel = sortMode === 'category' ? 'By Category' : sortMode === 'points-high' ? 'Points ↓' : 'Points ↑';

  const rank = leaderboard.findIndex(u => u.id === currentUser.id) + 1;

  return (
    <div className="pt-6 px-6 pb-32 min-h-screen">
      <div className="mb-8 bg-card rounded-[2rem] p-4 border-2 border-primary/10 shadow-sm">
        <div className="flex justify-between items-center mb-3 px-2">
          <span className="text-sm font-black uppercase tracking-widest text-primary">
            {format(today, "MMMM yyyy")}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Weekly View
          </span>
        </div>
        <div className="flex justify-between items-center gap-1">
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div 
                key={i} 
                className={cn(
                  "flex flex-col items-center flex-1 py-2 rounded-xl transition-all",
                  isToday ? "bg-primary text-primary-foreground shadow-lg scale-110 z-10" : "text-muted-foreground"
                )}
              >
                <span className="text-[10px] font-bold uppercase mb-1">
                  {format(day, "eee")}
                </span>
                <span className="text-sm font-black">
                  {format(day, "d")}
                </span>
                {isToday && <div className="w-1 h-1 bg-white rounded-full mt-1 animate-pulse" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <UserAvatar user={currentUser} size="md" />
          <div>
            <h2 className="font-display font-bold text-xl text-foreground leading-tight" data-testid="text-username">
              Hi, {currentUser.username}!
            </h2>
            <p className="text-sm font-bold text-muted-foreground flex items-center gap-1" data-testid="text-rank-streak">
              Rank #{rank} <Flame size={14} className="text-destructive ml-1" /> {currentUser.streak} days
            </p>
          </div>
        </div>
        
        <div className="bg-accent/10 border-2 border-accent/20 px-4 py-2 rounded-2xl flex items-center gap-2" data-testid="text-points">
          <Star className="w-5 h-5 fill-accent text-accent" />
          <span className="font-display font-bold text-lg text-foreground">{currentUser.points}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-5">
        <h3 className="font-display font-bold text-lg text-foreground">Your Chores</h3>
        <div className="flex items-center gap-2">
          {dailyChores.length > 0 && (
            <div className="relative">
              <button
                data-testid="button-bonus-info"
                onClick={() => setShowBonusInfo(!showBonusInfo)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  allDailyDone
                    ? "bg-success/15 text-success border border-success/30"
                    : "bg-accent/10 text-accent border border-accent/20"
                )}
              >
                <Trophy size={14} />
                <span>+{DAILY_STREAK_BONUS_PERCENT}%</span>
                <Info size={12} className="opacity-60" />
              </button>
              <AnimatePresence>
                {showBonusInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-card border-2 border-border rounded-2xl p-4 shadow-lg z-50"
                    data-testid="text-bonus-description"
                  >
                    <p className="text-xs font-semibold text-foreground leading-relaxed">
                      Complete all of <span className="text-primary font-bold">your daily chores</span> each day to build a streak. The next day, your daily chores earn <span className="text-accent font-bold">+{DAILY_STREAK_BONUS_PERCENT}% extra points</span> per streak day, up to +100%.
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                          style={{ width: `${dailyChores.length > 0 ? (dailyDoneCount / dailyChores.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span>{dailyDoneCount}/{dailyChores.length} today</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <button
            data-testid="button-sort-chores"
            onClick={cycleSortMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowUpDown size={14} />
            {sortLabel}
          </button>
        </div>
      </div>

      {sortMode === 'category' && groupedChores ? (
        <div className="space-y-6">
          {CATEGORY_ORDER.map(cat => {
            const choresInCat = groupedChores[cat];
            if (choresInCat.length === 0) return null;
            const config = CATEGORY_CONFIG[cat];
            return (
              <div key={cat}>
                <div className={cn("flex items-center gap-2 mb-3 px-1")}>
                  <div className={cn("w-2 h-2 rounded-full", config.bgColor.replace('/10', ''))} />
                  <span className={cn("text-xs font-black uppercase tracking-widest", config.color)}>
                    {config.label}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground ml-1">
                    ({choresInCat.length})
                  </span>
                  {cat === 'box' && (
                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-lg ml-auto">
                      +Bonus pts
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {choresInCat.map(chore => (
                      <ChoreCard
                        key={chore.id}
                        chore={chore}
                        onComplete={() => handleComplete(chore.id)}
                        isCompleting={completeMutation.isPending && completeMutation.variables?.id === chore.id}
                        displayPoints={
                          chore.type === "daily" && chore.assigneeId === currentUser.id && streakBonusPercent > 0
                            ? Math.ceil(chore.points * streakMultiplier)
                            : chore.points
                        }
                        streakBonusPercent={
                          chore.type === "daily" && chore.assigneeId === currentUser.id
                            ? streakBonusPercent
                            : 0
                        }
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}

          {myChores.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-12 h-12 text-success fill-success" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-1">No chores yet!</h3>
              <p className="text-muted-foreground font-medium">Ask your admin to add some chores to get started.</p>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedChores.map(chore => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                onComplete={() => handleComplete(chore.id)}
                isCompleting={completeMutation.isPending && completeMutation.variables?.id === chore.id}
                displayPoints={
                  chore.type === "daily" && chore.assigneeId === currentUser.id && streakBonusPercent > 0
                    ? Math.ceil(chore.points * streakMultiplier)
                    : chore.points
                }
                streakBonusPercent={
                  chore.type === "daily" && chore.assigneeId === currentUser.id
                    ? streakBonusPercent
                    : 0
                }
              />
            ))}
          </AnimatePresence>

          {sortedChores.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-12 h-12 text-success fill-success" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-1">No chores yet!</h3>
              <p className="text-muted-foreground font-medium">Ask your admin to add some chores to get started.</p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
