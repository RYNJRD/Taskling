import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion, PanInfo } from "framer-motion";
import { useParams } from "wouter";
import { useLocation } from "wouter";
import {
  Users, ClipboardList, Gift, Star, Flame, CheckCircle2,
  TrendingUp, Clock, ChevronRight, Shield, AlertCircle, Menu
} from "lucide-react";
import { useFamilyChores, useFamilyLeaderboard, useFamilyActivity, useFamilyUsers } from "../hooks/use-families";
import { UserAvatar } from "../components/UserAvatar";
import { useStore } from "../store/useStore";
import { cn } from "../lib/utils";
import { formatDistanceToNow, isToday, isThisWeek } from "date-fns";
import { QuickActionModals } from "../components/QuickActionModals";

/* ─── Auto-rotating Child Activity Carousel ─── */
function ChildActivityCarousel({
  children: childUsers,
  allChores,
  leaderboard,
}: {
  children: any[];
  allChores: any[];
  leaderboard: any[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideCount = childUsers.length;

  const clearTimers = useCallback(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
  }, []);

  const startAutoRotation = useCallback(() => {
    clearTimers();
    setIsPaused(false);
    autoTimerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideCount);
    }, 5000);
  }, [slideCount, clearTimers]);

  const handleUserInteraction = useCallback((newIndex: number) => {
    clearTimers();
    setIsPaused(true);
    setActiveIndex(newIndex);
    pauseTimerRef.current = setTimeout(() => {
      startAutoRotation();
    }, 5000);
  }, [clearTimers, startAutoRotation]);

  useEffect(() => {
    if (slideCount > 1) startAutoRotation();
    return clearTimers;
  }, [slideCount, startAutoRotation, clearTimers]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && activeIndex < slideCount - 1) {
      handleUserInteraction(activeIndex + 1);
    } else if (info.offset.x > threshold && activeIndex > 0) {
      handleUserInteraction(activeIndex - 1);
    }
  };

  if (childUsers.length === 0) {
    return (
      <div className="rounded-3xl p-6 text-center bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-slate-700 shadow-sm">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No children added yet. Invite your family!</p>
      </div>
    );
  }

  const child = childUsers[activeIndex];
  if (!child) return null;

  const childChores = allChores.filter((c: any) => c.assigneeId === child.id);
  const completedToday = childChores.filter((c: any) => {
    if (!c.lastCompletedAt) return false;
    return isToday(new Date(c.lastCompletedAt));
  });
  const completedThisWeek = childChores.filter((c: any) => {
    if (!c.lastCompletedAt) return false;
    return isThisWeek(new Date(c.lastCompletedAt), { weekStartsOn: 1 });
  });
  const starsEarnedToday = completedToday.reduce((sum: number, c: any) => sum + (c.points || 0), 0);
  const sorted = [...leaderboard].sort((a: any, b: any) => b.points - a.points);
  const rank = sorted.findIndex((u: any) => u.id === child.id) + 1;
  const totalChores = childChores.length || 1;
  const weeklyPct = Math.min(100, Math.round((completedThisWeek.length / totalChores) * 100));

  return (
    <div className="relative">
      {slideCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 mb-3">
          {childUsers.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => handleUserInteraction(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex ? "w-6 bg-slate-400 dark:bg-white/80" : "w-1.5 bg-slate-300 dark:bg-white/30"
              )}
            />
          ))}
        </div>
      )}

      <motion.div
        key={child.id}
        drag={slideCount > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="rounded-3xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-700 p-5 cursor-grab active:cursor-grabbing select-none shadow-sm backdrop-blur-md"
      >
        <div className="flex items-center gap-3 mb-5">
          <UserAvatar user={child} size="lg" className="border shadow-sm border-slate-200 dark:border-slate-700" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-display font-bold text-lg text-slate-900 dark:text-white truncate">{child.username}</p>
              <div className="flex items-center gap-1 bg-white/80 dark:bg-white/10 rounded-xl px-2.5 py-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{child.points}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Rank #{rank || "–"}</span>
              {child.streak > 0 && (
                <span className="text-xs font-bold text-orange-500 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />{child.streak}d streak
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-4 mb-4 border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Today</p>
          {completedToday.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">No chores completed today yet.</p>
          ) : (
            <div className="space-y-2.5">
              {completedToday.slice(0, 4).map((chore: any) => (
                <div key={chore.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm text-slate-800 dark:text-slate-200 font-medium truncate">{chore.title}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/30">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">+{chore.points}</span>
                  </div>
                </div>
              ))}
              {completedToday.length > 4 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">+{completedToday.length - 4} more</p>
              )}
            </div>
          )}
          {completedToday.length > 0 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Stars earned today</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{starsEarnedToday} ⭐</span>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {completedThisWeek.length} / {totalChores} this week
            </span>
            <span className="text-xs font-bold text-primary">{weeklyPct}%</span>
          </div>
          <div className="h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${weeklyPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
      </motion.div>

      {slideCount > 1 && (
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-3 font-medium">
          Swipe to see other children
        </p>
      )}
    </div>
  );
}

export default function ParentDashboard() {
  const { familyId } = useParams();
  const id = Number(familyId || 0);
  const [, setLocation] = useLocation();
  const { currentUser, family, setIsDrawerOpen } = useStore();
  const [activeModal, setActiveModal] = useState<'chore' | 'reward' | null>(null);

  const { data: allChores = [] } = useFamilyChores(id);
  const { data: leaderboard = [] } = useFamilyLeaderboard(id);
  const { data: activity = [] } = useFamilyActivity(id);
  const { data: users = [] } = useFamilyUsers(id);

  const children = useMemo(() =>
    leaderboard.filter((u) => u.role !== "admin"),
    [leaderboard]
  );

  const pendingCount = useMemo(() =>
    allChores.filter((c: any) => c.latestSubmissionStatus === "submitted").length,
    [allChores]
  );

  const adminPath = family?.id ? `/family/${family.id}/admin` : "/";

  const quickActions = [
    { icon: ClipboardList, label: "Assign Chore", color: "bg-white/80 dark:bg-white/10 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-700", action: () => setActiveModal('chore') },
    { icon: Gift, label: "Create Reward", color: "bg-white/80 dark:bg-white/10 text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-700", action: () => setActiveModal('reward') },
    { icon: Users, label: "Manage Family", color: "bg-white/80 dark:bg-white/10 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-700", action: () => setLocation(`${adminPath}#members`) },
  ];

  if (!currentUser) return null;

  return (
    <div className="pt-[max(1.5rem,env(safe-area-inset-top))] px-5 pb-32 min-h-screen bg-tab-home">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {family?.name ?? "Your Family"}
          </p>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            Hi, {currentUser.username} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={() => setLocation(adminPath)}
              className="flex items-center gap-1.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-3 py-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{pendingCount} pending</span>
            </button>
          )}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10 transition-colors shadow-sm active:scale-95"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-7"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Quick Actions</p>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map(({ icon: Icon, label, color, action }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.94 }}
              onClick={action}
              className={cn(
                "flex flex-col items-center gap-2.5 rounded-[20px] p-4 border transition-all duration-300 shadow-sm backdrop-blur-sm",
                color
              )}
            >
              <Icon className="w-6 h-6" strokeWidth={2} />
              <span className="text-xs font-bold text-center leading-tight">{label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <QuickActionModals
        familyId={id}
        isOpen={!!activeModal}
        type={activeModal || 'chore'}
        onClose={() => setActiveModal(null)}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-7"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Today's Activity</p>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">Live</span>
        </div>
        <ChildActivityCarousel
          children={children}
          allChores={allChores}
          leaderboard={leaderboard}
        />
      </motion.div>

      {[...leaderboard].sort((a, b) => b.points - a.points).slice(0, 3).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-7"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Top Stars</p>
            <button 
              onClick={() => setLocation(`/family/${id}/leaderboard`)}
              className="flex items-center gap-1 text-[11px] font-bold text-primary active:scale-95 transition-transform"
            >
              <TrendingUp className="w-3 h-3" /> Live ranking
            </button>
          </div>
          <div className="rounded-3xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-sm overflow-hidden">
            {[...leaderboard].sort((a, b) => b.points - a.points).slice(0, 3).map((u, i) => (
              <div
                key={u.id}
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3.5",
                  i < 2 && "border-b border-slate-200 dark:border-slate-700"
                )}
              >
                <span className="text-xl w-7 text-center flex-none">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                </span>
                <UserAvatar user={u} size="sm" className="border shadow-sm border-slate-200 dark:border-slate-700" />
                <span className="flex-1 font-bold text-[15px] text-slate-900 dark:text-white truncate">{u.username}</span>
                <div className="flex items-center gap-1.5 bg-white/80 dark:bg-white/10 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white tabular-nums">{u.points}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-7"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Recent Activity</p>
          <button
            onClick={() => setLocation(`/family/${id}/activity`)}
            className="flex items-center gap-0.5 text-[11px] font-bold text-primary"
          >
            See all <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {activity.length === 0 ? (
          <div className="rounded-3xl p-6 text-center bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No activity yet. Assign some chores to get started!</p>
          </div>
        ) : (
          <div className="rounded-3xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-sm overflow-hidden">
            {activity.slice(0, 5).map((event, i) => (
              <div
                key={event.id}
                className={cn(
                  "flex items-start gap-3.5 px-4 py-4",
                  i < Math.min(activity.length - 1, 4) && "border-b border-slate-200 dark:border-slate-700"
                )}
              >
                <div className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-white/10 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center flex-none">
                  <span className="text-[18px] leading-none">{event.type === "chore_completed" ? "✅" : event.type === "reward_claimed" ? "🎁" : "📋"}</span>
                </div>
                <div className="flex-1 min-w-0 mt-0.5">
                  <p className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight truncate">{event.title}</p>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-1">{event.body}</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 shrink-0 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDistanceToNow(new Date(event.createdAt))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
