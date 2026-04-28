import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useParams } from "wouter";
import { useLocation } from "wouter";
import {
  Users, ClipboardList, Gift, Star, Flame, CheckCircle2,
  TrendingUp, Clock, ChevronRight, Shield, AlertCircle, Menu,
  ChevronLeft
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

  // Clear all timers helper
  const clearTimers = useCallback(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
  }, []);

  // Start auto-rotation
  const startAutoRotation = useCallback(() => {
    clearTimers();
    setIsPaused(false);
    autoTimerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideCount);
    }, 5000);
  }, [slideCount, clearTimers]);

  // On user interaction: pause for 5 seconds then resume
  const handleUserInteraction = useCallback((newIndex: number) => {
    clearTimers();
    setIsPaused(true);
    setActiveIndex(newIndex);
    pauseTimerRef.current = setTimeout(() => {
      startAutoRotation();
    }, 5000);
  }, [clearTimers, startAutoRotation]);

  // Initial auto-rotation
  useEffect(() => {
    if (slideCount > 1) startAutoRotation();
    return clearTimers;
  }, [slideCount, startAutoRotation, clearTimers]);

  // Swipe handling
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
      <div className="rounded-2xl p-6 text-center glass-card" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
        <p className="text-sm text-muted-foreground font-medium">No children added yet. Invite your family!</p>
      </div>
    );
  }

  const child = childUsers[activeIndex];
  if (!child) return null;

  // Compute real stats for this child
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
      {/* Dot indicators */}
      {slideCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 mb-3">
          {childUsers.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => handleUserInteraction(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex ? "w-6 bg-white" : "w-1.5 bg-white/30"
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
        className="rounded-2xl glass-card p-4 cursor-grab active:cursor-grabbing select-none"
      >
        {/* Child header */}
        <div className="flex items-center gap-3 mb-4">
          <UserAvatar user={child} size="lg" className="border-2 border-white/30 shadow-lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-display font-bold text-lg text-white truncate">{child.username}</p>
              <div className="flex items-center gap-1 bg-white/10 rounded-xl px-2.5 py-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-white tabular-nums">{child.points}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[11px] font-medium text-white/60">Rank #{rank || "–"}</span>
              {child.streak > 0 && (
                <span className="text-[11px] font-bold text-orange-400 flex items-center gap-0.5">
                  <Flame className="w-3 h-3" />{child.streak}d streak
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Today's activity */}
        <div className="bg-white/5 rounded-xl p-3 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Today</p>
          {completedToday.length === 0 ? (
            <p className="text-sm text-white/40 italic">No chores completed today yet.</p>
          ) : (
            <div className="space-y-1.5">
              {completedToday.slice(0, 4).map((chore: any) => (
                <div key={chore.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-sm text-white/90 font-medium truncate">{chore.title}</span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 ml-2">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">+{chore.points}</span>
                  </div>
                </div>
              ))}
              {completedToday.length > 4 && (
                <p className="text-xs text-white/40 text-center mt-1">+{completedToday.length - 4} more</p>
              )}
            </div>
          )}
          {completedToday.length > 0 && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <span className="text-[11px] font-bold text-white/50">Stars earned today</span>
              <span className="text-sm font-bold text-amber-400">{starsEarnedToday} ⭐</span>
            </div>
          )}
        </div>

        {/* Weekly progress */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-medium text-white/50 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {completedThisWeek.length} / {totalChores} this week
            </span>
            <span className="text-[11px] font-bold text-primary">{weeklyPct}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${weeklyPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 shadow-sm shadow-primary/30"
            />
          </div>
        </div>
      </motion.div>

      {/* Swipe hint for multiple children */}
      {slideCount > 1 && (
        <p className="text-center text-[10px] text-white/30 mt-2 font-medium">
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

  // FIX: Count only chores that actually have a "submitted" submission pending review,
  // NOT just chores with requiresApproval flag set to true.
  const pendingCount = useMemo(() =>
    allChores.filter((c: any) => c.latestSubmissionStatus === "submitted").length,
    [allChores]
  );

  const adminPath = family?.id ? `/family/${family.id}/admin` : "/";

  const quickActions = [
    { icon: ClipboardList, label: "Assign Chore", color: "bg-blue-500/15 text-blue-500 border-blue-500/40 dark:text-blue-400 dark:border-blue-400/30", action: () => setActiveModal('chore') },
    { icon: Gift, label: "Create Reward", color: "bg-amber-500/15 text-amber-600 border-amber-500/40 dark:text-amber-400 dark:border-amber-400/30", action: () => setActiveModal('reward') },
    { icon: Users, label: "Manage Family", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/40 dark:text-emerald-400 dark:border-emerald-400/30", action: () => setLocation(`${adminPath}#members`) },
  ];

  if (!currentUser) return null;

  return (
    <div className="pt-[max(1.5rem,env(safe-area-inset-top))] px-5 pb-32 min-h-screen bg-tab-home">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {family?.name ?? "Your Family"}
          </p>
          <h1 className="font-display text-2xl font-bold text-white leading-tight">
            Hi, {currentUser.username} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={() => setLocation(adminPath)}
              className="flex items-center gap-1.5 rounded-2xl bg-rose-100 border-2 border-rose-200 px-3 py-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-xs font-bold text-rose-700">{pendingCount} pending</span>
            </button>
          )}
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" strokeWidth={2.5} />
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-2xl btn-glass text-white/70 hover:text-white transition-all duration-300 active:scale-95"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Quick Actions</p>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map(({ icon: Icon, label, color, action }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.94 }}
              onClick={action}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl p-3.5 border-[3px] transition-all duration-300 active:scale-95",
                color
              )}
              style={{
                backdropFilter: 'blur(12px)',
              }}
            >
              <Icon className="w-6 h-6" strokeWidth={2.5} />
              <span className="text-[12px] font-bold text-center leading-tight">{label}</span>
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

      {/* ── Child Activity Carousel (replaces Family Progress) ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Today's Activity</p>
          <span className="text-xs font-bold text-muted-foreground">Live</span>
        </div>
        <ChildActivityCarousel
          children={children}
          allChores={allChores}
          leaderboard={leaderboard}
        />
      </motion.div>

      {/* ── Leaderboard snapshot ── */}
      {[...leaderboard].sort((a, b) => b.points - a.points).slice(0, 3).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Top Stars</p>
            <button 
              onClick={() => setLocation(`/family/${id}/leaderboard`)}
              className="flex items-center gap-0.5 text-[10px] font-bold text-accent active:scale-95 transition-transform"
            >
              <TrendingUp className="w-3 h-3" /> Live ranking
            </button>
          </div>
          <div className="rounded-2xl glass-card overflow-hidden">
            {[...leaderboard].sort((a, b) => b.points - a.points).slice(0, 3).map((u, i) => (
              <div
                key={u.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  i < 2 && "border-b border-border/60"
                )}
              >
                <span className="text-lg w-7 text-center flex-none">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                </span>
                <UserAvatar user={u} size="sm" />
                <span className="flex-1 font-bold text-sm truncate">{u.username}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="font-bold text-sm tabular-nums">{u.points}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Recent Activity ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Recent Activity</p>
          <button
            onClick={() => setLocation(`/family/${id}/activity`)}
            className="flex items-center gap-0.5 text-[11px] font-bold text-primary"
          >
            See all <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {activity.length === 0 ? (
          <div className="rounded-2xl p-5 text-center glass-card" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p className="text-sm text-muted-foreground font-medium">No activity yet. Assign some chores to get started!</p>
          </div>
        ) : (
          <div className="rounded-2xl glass-card overflow-hidden">
            {activity.slice(0, 5).map((event, i) => (
              <div
                key={event.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3",
                  i < Math.min(activity.length - 1, 4) && "border-b border-border/60"
                )}
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-none mt-0.5">
                  <span className="text-base leading-none">{event.type === "chore_completed" ? "✅" : event.type === "reward_claimed" ? "🎁" : "📋"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-1">{event.body}</p>
                </div>
                <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

    </div>
  );
}
