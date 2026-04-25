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

const RANK_GLOW = [
  "glow-gold",
  "glow-silver",
  "glow-bronze",
];

const RANK_BORDER = [
  "rgba(255, 215, 0, 0.4)",
  "rgba(192, 192, 192, 0.3)",
  "rgba(205, 127, 50, 0.3)",
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
        <div className="p-6 glass-card rounded-3xl">
          <p className="font-bold text-rose-400">Error loading leaderboard</p>
          <p className="text-xs mt-1 text-white/50">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !leaderboard || !currentUser) {
    return (
      <div className="min-h-screen bg-tab-leaderboard flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-pulse"
          style={{ background: 'rgba(var(--glow-accent), 0.15)' }}>
          <Trophy className="w-8 h-8 text-amber-400" strokeWidth={3} />
        </div>
        <p className="text-lg font-bold text-amber-400 animate-pulse">Ranking the family...</p>
      </div>
    );
  }

  const visibleUsers = (leaderboard || [])
    .filter((u) => !u.hideFromLeaderboard)
    .sort((a, b) => b.points - a.points);
  
  const maxPoints = Math.max(...visibleUsers.map((u) => u.points), 1);

  return (
    <div className="flex flex-col min-h-full bg-tab-leaderboard">
      {/* ── Fixed Header ── */}
      <div className="px-5 pt-10 pb-6 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 glow-gold"
          style={{ background: 'rgba(255, 215, 0, 0.2)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
          <Trophy className="w-8 h-8 text-amber-400" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))' }} />
        </div>
        <h1 className="font-display text-3xl font-bold text-white text-glow-accent">Leaderboard</h1>
        <p className="text-sm font-medium text-white/40 mt-1">
          {visibleUsers.length === 0 ? "No one's ranked yet!" : `${visibleUsers.length} active members`}
        </p>
      </div>

      {/* ── Scrollable List ── */}
      <div className="flex-1 px-5 space-y-3 pb-32">
        {visibleUsers.length === 0 && (
           <div className="text-center py-20 glass-card rounded-[2rem]">
             <div className="text-4xl mb-2">🏆</div>
             <p className="text-white/50 font-bold">Complete chores to start ranking!</p>
           </div>
        )}

        {visibleUsers.map((user, index) => {
          const isMe = user.id === currentUser.id;
          const isTop3 = index < 3;
          
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 12 }}
              animate={index === 0 
                ? { opacity: 1, y: 0, rotate: [0, -1, 1, -0.5, 0] }
                : { opacity: 1, y: 0 }
              }
              transition={index === 0 
                ? { delay: 0.3, rotate: { repeat: Infinity, repeatDelay: 3, duration: 0.5, ease: "easeInOut" } }
                : { delay: index * 0.06 }
              }
              onClick={() => setSelectedUser(user)}
              className={cn(
                "flex items-center gap-3 rounded-2xl p-4 transition-all duration-300 cursor-pointer active:scale-[0.97]",
                isTop3 && RANK_GLOW[index],
              )}
              style={{
                background: isMe ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${
                  isTop3 ? RANK_BORDER[index] : 
                  isMe ? 'rgba(139, 92, 246, 0.3)' : 
                  'rgba(255, 255, 255, 0.06)'
                }`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="w-8 text-center font-display font-black text-lg">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : 
                  <span className="text-white/30">{index + 1}</span>}
              </div>
              <UserAvatar user={user} size="sm" className="border border-white/10" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-white/90 truncate">
                  {user.username} {isMe && <span className="text-primary font-black neon-flicker">(ME)</span>}
                </p>
                <div className="h-1.5 w-full rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${(user.points / maxPoints) * 100}%` }}
                     transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 + index * 0.1 }}
                     className="h-full rounded-full"
                     style={{
                       background: index === 0 
                         ? 'linear-gradient(90deg, rgb(250, 204, 21), rgb(245, 158, 11))' 
                         : 'linear-gradient(90deg, hsl(262, 83%, 58%), hsl(280, 75%, 60%))',
                       boxShadow: index === 0 
                         ? '0 0 8px rgba(250, 204, 21, 0.4)' 
                         : '0 0 8px rgba(139, 92, 246, 0.3)',
                     }}
                   />
                </div>
              </div>
              <div className="flex items-center gap-1 font-black text-sm px-2.5 py-1 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: 'rgb(250, 204, 21)',
                }}
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.5))' }} />
                {user.points}
              </div>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-xs rounded-[2.5rem] p-6 text-center gap-0 shadow-xl overflow-hidden"
          style={{
            background: 'rgba(18, 18, 32, 0.9)',
            backdropFilter: 'blur(32px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {selectedUser && (
            <>
              <div className="mx-auto mb-4 border-2 border-primary/20 p-1 rounded-full" style={{ boxShadow: '0 0 20px rgba(var(--glow-primary), 0.2)' }}>
                <UserAvatar user={selectedUser} size="lg" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white">{selectedUser.username}</h2>
              <p className="text-sm font-bold text-white/40 uppercase tracking-widest mt-1 mb-5">
                {selectedUser.role === 'admin' ? 'Parent' : 'Child'} • Rank #{visibleUsers.findIndex(u => u.id === selectedUser.id) + 1}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="glass-card rounded-2xl py-3 px-2 flex flex-col items-center">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400 mb-1" style={{ filter: 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.5))' }} />
                  <span className="font-bold text-lg leading-none text-white">{selectedUser.points}</span>
                  <span className="text-[10px] text-amber-400/60 font-bold uppercase mt-1">Stars</span>
                </div>
                <div className="glass-card rounded-2xl py-3 px-2 flex flex-col items-center">
                  <div className="text-lg leading-none mb-1 mt-0.5">🔥</div>
                  <span className="font-bold text-lg leading-none text-white">{selectedUser.streak}</span>
                  <span className="text-[10px] text-orange-400/60 font-bold uppercase mt-1">Streak</span>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full btn-neon-primary text-white font-bold py-3 rounded-2xl"
              >
                Close
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
