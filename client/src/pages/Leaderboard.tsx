import { useParams } from "wouter";
import { useFamilyLeaderboard } from "../hooks/use-families";
import { useStore } from "../store/useStore";
import { Trophy, Star, MessageCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { UserAvatar } from "../components/UserAvatar";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { useState } from "react";
import type { User } from "../../../shared/schema";

const RANK_META = [
  { emoji: "🥇", label: "1st", gradient: "from-yellow-400 to-amber-500", glow: "shadow-amber-300/50", size: "scale-110", border: "border-amber-300" },
  { emoji: "🥈", label: "2nd", gradient: "from-slate-300 to-slate-400", glow: "shadow-slate-200/50", size: "scale-100", border: "border-slate-300" },
  { emoji: "🥉", label: "3rd", gradient: "from-amber-600 to-orange-600", glow: "shadow-orange-300/50", size: "scale-100", border: "border-orange-400" },
];

export default function Leaderboard() {
  const { familyId } = useParams();
  const id = Number(familyId || "0");
  const { data: leaderboard, isLoading, error } = useFamilyLeaderboard(id);
  const { currentUser } = useStore();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (error) {
    return (
      <div className="min-h-screen bg-tab-leaderboard flex items-center justify-center p-6 text-center">
        <div className="p-6 bg-red-50 text-red-600 rounded-3xl border-2 border-red-100">
          <p className="font-bold">Could not load leaderboard</p>
          <p className="text-xs mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !leaderboard || !currentUser) {
    return (
      <div className="min-h-screen bg-tab-leaderboard flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mx-auto animate-pulse">
            <Trophy className="w-8 h-8 text-primary/40" />
          </div>
          <p className="text-sm font-bold text-muted-foreground animate-pulse">Loading ranking...</p>
        </div>
      </div>
    );
  }

  const visibleUsers = leaderboard
    .filter((u) => !u.hideFromLeaderboard)
    .sort((a, b) => b.points - a.points);
  
  const maxPoints = Math.max(...visibleUsers.map((u) => u.points), 1);
  const myRank = visibleUsers.findIndex((u) => u.id === currentUser.id) + 1;

  const topThree = visibleUsers.slice(0, 3);
  const rest = visibleUsers.slice(3);

  return (
    <div className="min-h-screen bg-tab-leaderboard pb-32">
      {/* ── Header ── */}
      <div className="relative overflow-hidden pt-8 pb-6 px-5 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="relative text-center">
          <div className="w-16 h-16 bg-accent/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-8 h-8 text-accent" />
          </div>
          <h1 className="font-display text-3xl font-bold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {visibleUsers.length === 0 ? "No one's ranked yet!" : `${visibleUsers.length} active members`}
          </p>
        </div>
      </div>

      <div className="px-5 space-y-3">
        {visibleUsers.length === 0 && (
           <div className="text-center py-20">
             <div className="text-4xl mb-2">🏆</div>
             <p className="text-muted-foreground font-medium">Complete chores to start ranking!</p>
           </div>
        )}

        {visibleUsers.map((user, index) => {
          const isTop3 = index < 3;
          const isMe = user.id === currentUser.id;
          
          return (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={cn(
                "flex items-center gap-3 rounded-2xl p-4 border-2 transition-all cursor-pointer",
                isMe ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-800 bg-card",
                index === 0 && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/10"
              )}
            >
              <div className="w-8 text-center font-display font-bold text-lg text-muted-foreground">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
              </div>
              <UserAvatar user={user} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">
                  {user.username} {isMe && "(Me)"}
                </p>
                <div className="h-1.5 w-full bg-muted rounded-full mt-1.5 overflow-hidden">
                   <div 
                     className="h-full bg-primary rounded-full transition-all duration-1000" 
                     style={{ width: `${(user.points / maxPoints) * 100}%` }}
                   />
                </div>
              </div>
              <div className="flex items-center gap-1 font-bold text-sm bg-muted/50 px-2 py-1 rounded-xl">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {user.points}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-xs rounded-[2.5rem] p-6 border-2 border-slate-300 dark:border-slate-700 text-center gap-0 shadow-xl">
          {selectedUser && (
            <>
              <div className="mx-auto mb-4">
                <UserAvatar user={selectedUser} size="lg" />
              </div>
              <h2 className="font-display text-2xl font-bold">{selectedUser.username}</h2>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1 mb-5">
                {selectedUser.role === 'admin' ? 'Parent' : 'Child'} • Rank #{visibleUsers.findIndex(u => u.id === selectedUser.id) + 1}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl py-3 px-2 flex flex-col items-center">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400 mb-1" />
                  <span className="font-bold text-lg leading-none">{selectedUser.points}</span>
                  <span className="text-[10px] text-amber-900/60 font-bold uppercase mt-1">Stars</span>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-2xl py-3 px-2 flex flex-col items-center">
                  <div className="text-lg leading-none mb-1 mt-0.5">🔥</div>
                  <span className="font-bold text-lg leading-none">{selectedUser.streak}</span>
                  <span className="text-[10px] text-orange-900/60 font-bold uppercase mt-1">Day Streak</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  disabled
                  className="flex-1 flex items-center justify-center gap-2 bg-muted/60 text-muted-foreground font-bold text-sm py-3 rounded-2xl opacity-60 cursor-not-allowed"
                >
                  <MessageCircle className="w-4 h-4" /> Message
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

