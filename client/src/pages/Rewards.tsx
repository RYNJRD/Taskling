import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Lock, Minus, Plus, ShieldCheck, Star } from "lucide-react";
import { useParams } from "wouter";
import confetti from "canvas-confetti";
import { api, buildUrl } from "../../../shared/routes";
import { queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useRewards } from "../hooks/use-rewards";
import { useStore } from "../store/useStore";
import { apiFetch } from "../lib/apiFetch";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";

const EMOJI_MAP: Record<string, string> = {
  robux: "ðŸŽ®",
  movie: "ðŸŽ¬",
  bedtime: "ðŸŒ™",
  pizza: "ðŸ•",
  game: "ðŸ•¹ï¸",
  ice: "ðŸ¦",
  trip: "ðŸš—",
};

function getRewardEmoji(title: string, fallback?: string | null) {
  if (fallback) return fallback;
  const match = Object.entries(EMOJI_MAP).find(([key]) => title.toLowerCase().includes(key));
  return match?.[1] ?? "ðŸŽ";
}

export default function Rewards() {
  const { familyId } = useParams();
  const id = Number(familyId || 0);
  const { toast } = useToast();
  const { currentUser, setCurrentUser } = useStore();
  const { data: rewards = [], isLoading } = useRewards(id);
  const [activeRewardId, setActiveRewardId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser || isLoading) return null;

  const handleClaim = async (rewardId: number) => {
    setIsSubmitting(true);
    try {
      const res = await apiFetch(buildUrl(api.rewards.claim.path, { id: rewardId }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not claim reward");

      setCurrentUser(data.user);
      queryClient.invalidateQueries({ queryKey: [api.families.getActivity.path, id] });

      if (data.claim?.status === "submitted") {
        toast({
          title: "Request sent",
          description: "A parent or admin will review your reward request.",
        });
      } else {
        confetti({
          particleCount: 180,
          spread: 120,
          origin: { y: 0.5 },
          colors: ["#FFD700", "#FDB931", "#FF8C00"],
        });
        toast({
          title: "Reward claimed",
          description: "Enjoy it. You earned it.",
        });
      }

      setActiveRewardId(null);
      setQuantity(1);
    } catch (error) {
      toast({
        title: "Could not claim reward",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-8 px-5 pb-32 min-h-screen bg-tab-rewards">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="w-14 h-14 bg-secondary/20 rounded-[1.5rem] flex items-center justify-center mb-3 -rotate-6">
            <Gift className="w-7 h-7 text-secondary" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Rewards</h1>
          <p className="text-sm text-muted-foreground mt-1">Turn your stars into something fun.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-muted-foreground mb-1">Your balance</p>
          <div className="inline-flex items-center gap-1 bg-accent/10 px-3 py-1.5 rounded-xl border-2 border-accent/20">
            <Star className="w-5 h-5 fill-accent text-accent" />
            <span className="font-display font-bold text-xl text-foreground">{currentUser.points}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {rewards.map((reward, index) => {
          const isActive = activeRewardId === reward.id;
          const totalCost = reward.costPoints * (isActive ? quantity : 1);
          const canAfford = currentUser.points >= totalCost;

          return (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={cn(
                "rounded-[1.75rem] border-2 bg-card p-4 shadow-sm",
                canAfford ? "border-border" : "border-border/70 opacity-85",
              )}
            >
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-[1.5rem] bg-primary/8 flex items-center justify-center text-3xl shrink-0">
                  {getRewardEmoji(reward.title, reward.emoji)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-bold leading-tight">{reward.title}</h2>
                      {reward.description ? <p className="text-sm text-muted-foreground mt-1">{reward.description}</p> : null}
                    </div>
                    {!canAfford && !reward.requiresApproval && <Lock className="w-5 h-5 text-muted-foreground/60 shrink-0" />}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent flex items-center gap-1">
                      <Star className="w-3 h-3 fill-accent" />
                      {reward.costPoints} each
                    </span>
                    {reward.requiresApproval && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Needs approval
                      </span>
                    )}
                  </div>

                  {isActive ? (
                    <div className="mt-4 rounded-2xl bg-muted/60 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                            <Minus size={16} />
                          </Button>
                          <span className="min-w-8 text-center font-bold text-lg">{quantity}</span>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setQuantity((value) => value + 1)}>
                            <Plus size={16} />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Total</p>
                          <p className="font-display text-lg font-bold">{totalCost} stars</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button className="flex-1 min-h-[48px] rounded-2xl font-bold" disabled={!canAfford && !reward.requiresApproval || isSubmitting} onClick={() => handleClaim(reward.id)}>
                          {reward.requiresApproval ? "Request reward" : "Claim reward"}
                        </Button>
                        <Button variant="outline" className="rounded-2xl" onClick={() => { setActiveRewardId(null); setQuantity(1); }}>
                          Cancel
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {reward.requiresApproval
                          ? "Stars are deducted only if this request gets approved."
                          : `You will have ${Math.max(0, currentUser.points - totalCost)} stars left after claiming.`}
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={() => { setActiveRewardId(reward.id); setQuantity(1); }}
                      disabled={!canAfford && !reward.requiresApproval}
                      className={cn(
                        "mt-4 w-full rounded-2xl font-bold",
                        !canAfford && !reward.requiresApproval && "opacity-60 cursor-not-allowed",
                      )}
                    >
                      {reward.requiresApproval ? "Request this reward" : "Claim for " + reward.costPoints}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
