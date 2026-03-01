import { useParams } from "wouter";
import { useFamilyLeaderboard } from "@/hooks/use-families";
import { useStore } from "@/store/useStore";
import { Trophy, Star, Crown, Medal } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { familyId } = useParams();
  const id = parseInt(familyId || "0");
  const { data: leaderboard, isLoading } = useFamilyLeaderboard(id);
  const { currentUser } = useStore();

  if (isLoading || !leaderboard || !currentUser) return null;

  const visibleUsers = leaderboard
    .filter(u => !u.hideFromLeaderboard)
    .sort((a, b) => b.points - a.points);
  const maxPoints = Math.max(...visibleUsers.map(u => u.points), 1);

  return (
    <div className="pt-8 px-6 pb-32 min-h-screen bg-background">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-accent/20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 rotate-12">
          <Trophy className="w-8 h-8 text-accent" strokeWidth={2.5} />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground" data-testid="text-leaderboard-title">Leaderboard</h1>
      </div>

      <div className="space-y-4">
        {visibleUsers.map((user, index) => {
          const isMe = user.id === currentUser.id;
          const isFirst = index === 0;
          const isSecond = index === 1;
          const isThird = index === 2;
          
          return (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              key={user.id}
              className={cn(
                "bg-card rounded-[1.5rem] p-4 border-2 flex items-center gap-4 relative overflow-hidden",
                isMe ? "border-primary shadow-bouncy-active" : "border-border shadow-sm",
                isFirst && "bg-gradient-to-r from-accent/5 to-transparent border-accent"
              )}
            >
              {/* Rank Badge */}
              <div className="flex items-center justify-center w-8 font-display font-bold text-xl">
                {isFirst ? <Crown className="text-accent fill-accent" size={28} /> : 
                 isSecond ? <Medal className="text-gray-400" size={24} /> :
                 isThird ? <Medal className="text-amber-600" size={24} /> : 
                 <span className="text-muted-foreground">{index + 1}</span>}
              </div>

              {/* Avatar */}
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-white shadow-inner flex-shrink-0 z-10",
                isFirst ? "bg-accent border-2 border-white" : "bg-primary"
              )}>
                {user.username.charAt(0).toUpperCase()}
              </div>

              {/* Progress & Info */}
              <div className="flex-1 min-w-0 z-10">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-display font-bold text-foreground truncate text-lg">
                    {user.username} {isMe && "(You)"}
                  </span>
                  <span className="font-bold flex items-center gap-1 text-sm bg-muted px-2 py-0.5 rounded-lg">
                    {user.points} <Star size={12} className="fill-accent text-accent" />
                  </span>
                </div>
                
                {/* Progress Bar background */}
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(user.points / maxPoints) * 100}%` }}
                    transition={{ duration: 1, delay: 0.2 + (index * 0.1), ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      isFirst ? "bg-accent" : "bg-primary"
                    )}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
