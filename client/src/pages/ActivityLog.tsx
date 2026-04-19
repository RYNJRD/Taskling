import { useParams, useLocation } from "wouter";
import { useFamilyActivity } from "../hooks/use-families";
import { useStore } from "../store/useStore";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Star, Gift, CheckCircle2, TrendingUp, Filter } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "../lib/utils";
import { UserAvatar } from "../components/UserAvatar";
import { useState } from "react";

export default function ActivityLog() {
  const { familyId } = useParams();
  const id = Number(familyId || 0);
  const [, setLocation] = useLocation();
  const { currentUser } = useStore();
  const { data: activity = [], isLoading } = useFamilyActivity(id);
  const [filter, setFilter] = useState<'all' | 'chores' | 'rewards'>('all');

  if (!currentUser || isLoading) return null;

  const filteredActivity = activity.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'chores') return item.type === 'chore_completed';
    if (filter === 'rewards') return item.type === 'reward_claimed';
    return true;
  });

  return (
    <div className="pt-[max(1.5rem,env(safe-area-inset-top))] px-5 pb-32 min-h-screen bg-slate-50 dark:bg-zinc-950">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => window.history.back()}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-background border-2 border-border shadow-sm active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold">Family Activity</h1>
          <p className="text-sm text-muted-foreground">Detailed history of everything happening.</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar py-1">
        {(['all', 'chores', 'rewards'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all border-2",
              filter === f 
                ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "bg-background border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Activity Feed ── */}
      <div className="space-y-4">
        {filteredActivity.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">No activity to show yet.</p>
          </div>
        ) : (
          filteredActivity.map((item, index) => {
            const date = new Date(item.createdAt);
            const isChore = item.type === 'chore_completed';
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-card rounded-[1.75rem] p-4 border-2 border-border shadow-sm hover:border-primary/30 transition-all"
              >
                <div className="flex gap-4">
                  <div className="relative shrink-0">
                    <UserAvatar user={item.user} size="md" className="border-2 border-background shadow-sm" />
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-background shadow-xs text-[10px]",
                      isChore ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                    )}>
                      {isChore ? <CheckCircle2 size={12} /> : <Gift size={12} />}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[15px] font-bold leading-tight truncate">
                        <span className="text-foreground">{item.user.username}</span>
                        <span className="text-muted-foreground font-medium mx-1">
                          {isChore ? "completed" : "claimed"}
                        </span>
                      </p>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-md">
                        {formatDistanceToNow(date, { addSuffix: true })}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-foreground leading-tight mb-2">
                       {item.description}
                    </h3>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/10">
                        <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                        <span className="text-xs font-bold text-primary">
                          {isChore ? `+${item.metadata?.awardedPoints || 0}` : `-${item.metadata?.costPoints || 0}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {format(date, "h:mm a")}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
