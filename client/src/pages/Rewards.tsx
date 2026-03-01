import { useParams, Link } from "wouter";
import { useRewards } from "@/hooks/use-rewards";
import { useStore } from "@/store/useStore";
import { Gift, Star, Lock, Plus, Minus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";

const EMOJI_MAP: Record<string, string> = {
  "ice cream": "🍦",
  "pizza": "🍕",
  "movie": "🎬",
  "robux": "🎮",
  "stay up": "🌙",
  "game": "🕹️",
  "toy": "🧸",
  "candy": "🍬",
  "money": "💰",
  "trip": "🚗",
  "pass": "🎫",
};

function getEmoji(title: string) {
  const t = title.toLowerCase();
  for (const [key, val] of Object.entries(EMOJI_MAP)) {
    if (t.includes(key)) return val;
  }
  return "🎁";
}

export default function Rewards() {
  const { familyId } = useParams();
  const id = parseInt(familyId || "0");
  const { data: rewards, isLoading } = useRewards(id);
  const { currentUser, setCurrentUser } = useStore();
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isPending, setIsPending] = useState(false);

  if (isLoading || !rewards || !currentUser) return null;

  const handleClaim = async (reward: any) => {
    setIsPending(true);
    try {
      const res = await fetch(buildUrl(api.rewards.claim.path, { id: reward.id }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, quantity }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      const data = await res.json();
      setCurrentUser(data.user);
      queryClient.invalidateQueries({ queryKey: [buildUrl(api.messages.list.path, { id: currentUser.familyId || 0 })] });

      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FDB931', '#FF8C00']
      });

      setClaimingId(null);
      setQuantity(1);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="pt-8 px-6 pb-32 min-h-screen bg-background">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="w-14 h-14 bg-secondary/20 rounded-[1.5rem] flex items-center justify-center mb-3 -rotate-6">
            <Gift className="w-7 h-7 text-secondary" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Rewards</h1>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-muted-foreground mb-1">Your Balance</p>
          <div className="inline-flex items-center gap-1 bg-accent/10 px-3 py-1.5 rounded-xl border-2 border-accent/20">
            <Star className="w-5 h-5 fill-accent text-accent" />
            <span className="font-display font-bold text-xl text-foreground">{currentUser.points}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {rewards.map((reward, i) => {
          const canAfford = currentUser.points >= (reward.costPoints * (claimingId === reward.id ? quantity : 1));
          const isClaiming = claimingId === reward.id;
          
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              key={reward.id}
              className={cn(
                "bg-card rounded-[1.5rem] p-4 border-2 flex flex-col h-full relative overflow-hidden",
                canAfford ? "border-border shadow-bouncy" : "border-border/50 opacity-80"
              )}
            >
              <div className="flex-1 flex flex-col items-center justify-center text-center mb-4 min-h-[120px]">
                {!canAfford && !isClaiming && <Lock className="w-8 h-8 text-muted-foreground/50 absolute top-4 right-4" />}
                <div className="text-4xl mb-2">{reward.emoji || (reward.title.match(/\p{Emoji}/u) ? "" : getEmoji(reward.title))}</div>
                <h3 className="font-display font-bold text-lg leading-tight">{reward.title}</h3>
              </div>
              
              <AnimatePresence mode="wait">
                {isClaiming ? (
                  <motion.div 
                    key="adjuster"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between bg-muted rounded-xl p-1">
                      <Button 
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Minus size={16} />
                      </Button>
                      <span className="font-black text-lg">{quantity}</span>
                      <Button 
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                    <Button 
                      className="w-full bg-success text-success-foreground font-black uppercase tracking-tighter"
                      disabled={!canAfford || isPending}
                      onClick={() => handleClaim(reward)}
                    >
                      {isPending ? "..." : <><Check className="mr-1" size={16}/> Confirm</>}
                    </Button>
                    <button 
                      className="w-full text-[10px] font-bold text-muted-foreground uppercase"
                      onClick={() => { setClaimingId(null); setQuantity(1); }}
                    >
                      Cancel
                    </button>
                  </motion.div>
                ) : (
                  <button
                    key="buy"
                    disabled={!canAfford}
                    onClick={() => setClaimingId(reward.id)}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-1 transition-all",
                      canAfford 
                        ? "bg-secondary text-secondary-foreground shadow-bouncy-active active:translate-y-[2px]" 
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    {reward.costPoints} <Star size={16} className={canAfford ? "fill-secondary-foreground" : ""} />
                  </button>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Admin Quick Create Button */}
        {currentUser.role === 'admin' && (
          <Link href="/admin">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: rewards.length * 0.1 }}
              className="bg-dashed rounded-[1.5rem] p-4 border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-center h-full min-h-[180px] hover:border-secondary hover:bg-secondary/5 cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-secondary" strokeWidth={3} />
              </div>
              <h3 className="font-display font-bold text-sm text-muted-foreground group-hover:text-secondary transition-colors">
                Create More<br/>Rewards
              </h3>
            </motion.div>
          </Link>
        )}
      </div>
      
      {rewards.length === 0 && currentUser.role !== 'admin' && (
        <div className="text-center py-12 text-muted-foreground font-medium">
          No rewards set up yet. Ask an admin to create some!
        </div>
      )}
    </div>
  );
}
