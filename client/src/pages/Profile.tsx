import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon, Check, Trophy, Star, Flame } from "lucide-react";
import { useLocation } from "wouter";
import { api, buildUrl } from "../../../shared/routes";
import { queryClient } from "../lib/queryClient";
import { useStore } from "../store/useStore";
import { apiFetch } from "../lib/apiFetch";
import {
  PENGUIN_OUTFITS,
  parseAvatarConfig,
  type AvatarConfig,
} from "../lib/avatar";
import { cn } from "../lib/utils";

export default function Profile() {
  const { currentUser, setCurrentUser, family, setIsDrawerOpen } = useStore();
  const [config, setConfig] = useState<AvatarConfig>(() => parseAvatarConfig(currentUser?.avatarConfig));

  useEffect(() => {
    setConfig(parseAvatarConfig(currentUser?.avatarConfig));
  }, [currentUser?.avatarConfig]);

  const mutation = useMutation({
    mutationFn: async (nextConfig: AvatarConfig) => {
      const res = await apiFetch(
        buildUrl(api.users.updateAvatar.path, { id: currentUser?.id || 0 }),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarConfig: JSON.stringify(nextConfig) }),
        },
      );
      if (!res.ok) throw new Error("Failed to save avatar");
      return res.json();
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      queryClient.invalidateQueries({ queryKey: [api.families.getUsers.path, user.familyId] });
    },
  });

  if (!currentUser) return null;

  const selectedId = config.outfit ?? "classic";
  const selectedOutfit = useMemo(
    () => PENGUIN_OUTFITS.find((o) => o.id === selectedId) ?? PENGUIN_OUTFITS[0],
    [selectedId],
  );

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden select-none relative">
      {/* ── Top Section (HUD) ── */}
      <div className="flex-none px-6 pt-10 pb-2 z-10 relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/5">
               <Trophy className="w-6 h-6 text-primary" />
             </div>
             <div>
               <h1 className="text-2xl font-black tracking-tight">{currentUser.username}</h1>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Explorer Level 1</p>
             </div>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center border border-border/50 active:scale-90 transition-transform"
          >
             <SettingsIcon className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
           <div className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Stars</span>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-display font-black text-xl leading-none">{currentUser.points}</span>
              </div>
           </div>
           <div className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Streak</span>
              <div className="flex items-center gap-2 text-orange-500">
                <Flame className="w-4 h-4 fill-current" />
                <span className="font-display font-black text-xl leading-none">{currentUser.streak || 0}</span>
              </div>
           </div>
           <div className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Rank</span>
               <div className="flex items-center gap-2">
                <span className="text-sm font-black text-primary">#</span>
                <span className="font-display font-black text-xl leading-none">1</span>
              </div>
           </div>
        </div>
      </div>

      {/* ── Character Center-Top (2/5 of screen) ── */}
      <div className="flex-[2] relative flex flex-col items-center justify-center px-6 min-h-0 pointer-events-none">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/10 blur-[120px] rounded-full z-0 pointer-events-none" />
        
        {/* The Penguin */}
        <div className="relative w-full h-full flex items-center justify-center z-10 scale-125">
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedId}
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 15 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              src={selectedOutfit.image}
              alt={selectedOutfit.label}
              className="h-full w-auto object-contain drop-shadow-[0_45px_60px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_45px_60px_rgba(0,0,0,0.5)]"
            />
          </AnimatePresence>
        </div>

        {/* Poduim shadow */}
        <div className="relative -mt-12 w-40 h-10 z-0">
          <div className="absolute inset-0 bg-primary/5 border border-primary/10 rounded-[100%] backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-[100%] opacity-20" />
        </div>
      </div>

      {/* ── Wardrobe Section (3/5 of screen) ── */}
      <div className="flex-[3] relative z-20 flex flex-col bg-card/60 backdrop-blur-2xl border-t border-border rounded-t-[3.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex-none flex items-center justify-between px-8 pt-8 pb-4">
           <div>
             <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Wardrobe</h2>
             <div className="h-1 w-8 bg-primary rounded-full mt-2" />
           </div>
           <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">{PENGUIN_OUTFITS.length} Items</span>
        </div>

        {/* Wardrobe Grid */}
        <div className="flex-1 overflow-y-auto px-8 pb-32 pt-4 no-scrollbar touch-pan-y overscroll-contain">
          <div className="grid grid-cols-3 gap-5">
            {PENGUIN_OUTFITS.map((outfit) => {
              const isSelected = selectedId === outfit.id;
              return (
                <button
                  key={outfit.id}
                  onClick={() => {
                    if (!outfit.comingSoon) {
                      const nextConfig = { outfit: outfit.id };
                      setConfig(nextConfig);
                      mutation.mutate(nextConfig);
                    }
                  }}
                  className={cn(
                    "group relative aspect-square rounded-[2rem] border transition-all duration-300 flex flex-col items-center justify-center p-3 overflow-hidden",
                    isSelected 
                      ? "bg-primary/5 border-primary shadow-[0_15px_30px_rgba(var(--primary),0.1)] scale-105" 
                      : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border active:scale-95"
                  )}
                >
                  <img src={outfit.image} className="w-full h-full object-contain pointer-events-none drop-shadow-sm" />
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-background">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={5} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
