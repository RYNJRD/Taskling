import { useMemo } from "react";
import { motion } from "framer-motion";
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
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { QuickActionModals } from "../components/QuickActionModals";

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
    allChores.filter((c) => c.requiresApproval).length,
    [allChores]
  );

  const getChildStats = (userId: number) => {
    const userChores = allChores.filter((c) => c.assigneeId === userId);
    const doneThisWeek = userChores.filter((c) => {
      if (!c.lastCompletedAt) return false;
      const days = (Date.now() - new Date(c.lastCompletedAt).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 7;
    }).length;
    const total = userChores.length || 1;
    return { doneThisWeek, total, pct: Math.min(100, Math.round((doneThisWeek / total) * 100)) };
  };

  const adminPath = family?.id ? `/family/${family.id}/admin` : "/";

  const quickActions = [
    { icon: ClipboardList, label: "Assign Chore", color: "bg-primary/10 text-primary border-primary/20", action: () => setActiveModal('chore') },
    { icon: Gift, label: "Create Reward", color: "bg-amber-100 text-amber-700 border-amber-200", action: () => setActiveModal('reward') },
    { icon: Users, label: "Manage Family", color: "bg-green-100 text-green-700 border-green-200", action: () => setLocation(`${adminPath}#members`) },
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
          <h1 className="font-display text-2xl font-bold text-foreground leading-tight">
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
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-black/20 backdrop-blur-md border border-white/20 shadow-sm text-foreground hover:bg-black/30 transition-colors"
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
                "flex flex-col items-center gap-2 rounded-2xl border-2 p-3.5 shadow-sm transition-all active:scale-95",
                color
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="text-[11px] font-bold text-center leading-tight">{label}</span>
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

      {/* ── Family Overview ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Family Progress</p>
          <span className="text-xs font-bold text-muted-foreground">This week</span>
        </div>

        {children.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground font-medium">No children added yet. Invite your family!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {children.map((child, i) => {
              const stats = getChildStats(child.id);
              const sorted = [...leaderboard].sort((a, b) => b.points - a.points);
              const rank = sorted.findIndex((u) => u.id === child.id) + 1;
              return (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className="rounded-2xl border-2 border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <UserAvatar user={child} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm truncate">{child.username}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span className="text-xs font-bold tabular-nums">{child.points}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          Rank #{rank}
                        </span>
                        {child.streak > 0 && (
                          <span className="text-[11px] font-bold text-orange-500 flex items-center gap-0.5">
                            <Flame className="w-3 h-3" />{child.streak}d streak
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {stats.doneThisWeek} / {stats.total} chores done
                      </span>
                      <span className="text-[11px] font-bold text-primary">{stats.pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.pct}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.3 + i * 0.1 }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 shadow-sm shadow-primary/30"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
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
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-accent">
              <TrendingUp className="w-3 h-3" /> Live ranking
            </span>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card shadow-sm overflow-hidden">
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
          <div className="rounded-2xl border-2 border-dashed border-border bg-card p-5 text-center">
            <p className="text-sm text-muted-foreground font-medium">No activity yet. Assign some chores to get started!</p>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-border bg-card shadow-sm overflow-hidden">
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
