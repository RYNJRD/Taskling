import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Settings as SettingsIcon, Check } from "lucide-react";
import { useLocation } from "wouter";
import { api, buildUrl } from "../../../shared/routes";
import { queryClient } from "../lib/queryClient";
import { useStore } from "../store/useStore";
import { apiFetch } from "../lib/apiFetch";
import {
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Settings as SettingsIcon, Check, Trophy, Star } from "lucide-react";
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
  const { currentUser, setCurrentUser, family } = useStore();
  const [, setLocation] = useLocation();

  const [config, setConfig] = useState<AvatarConfig>(() =>
    parseAvatarConfig(currentUser?.avatarConfig),
  );

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
      queryClient.invalidateQueries({
        queryKey: [api.families.getUsers.path, user.familyId],
      });
    },
  });

  if (!currentUser) return null;

  const selectedId = config.outfit ?? "classic";
  const selectedOutfit = useMemo(
    () => PENGUIN_OUTFITS.find((o) => o.id === selectedId) ?? PENGUIN_OUTFITS[0],
    [selectedId],
  );

  return (
    <div className="flex flex-col h-full bg-[#0F0F1A] text-white overflow-hidden select-none">
      {/* ── Animated Background ── */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full" />
      </div>

      {/* ── Top Bar ── */}
      <div className="relative z-10 flex flex-col px-6 pt-10 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
               <Trophy className="w-5 h-5 text-amber-400" />
             </div>
             <div>
               <h1 className="text-xl font-black tracking-tight">{currentUser.username}</h1>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary">Explorer Level 1</span>
                 <div className="h-1 w-20 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full w-[30%] bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                 </div>
               </div>
             </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 opacity-50">
             <SettingsIcon className="w-5 h-5 text-white/40" />
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-3 gap-3">
           <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Stars</span>
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-display font-black text-lg leading-none">{currentUser.points}</span>
              </div>
           </div>
           <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Streak</span>
              <div className="flex items-center gap-1.5">
                <span className="text-lg leading-none">🔥</span>
                <span className="font-display font-black text-lg leading-none">{currentUser.streak || 0}</span>
              </div>
           </div>
           <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Rank</span>
               <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-primary">#</span>
                <span className="font-display font-black text-lg leading-none">1</span>
              </div>
           </div>
        </div>
      </div>

      {/* ── Character Stage (Main Focus) ── */}
      <div className="flex-1 relative flex flex-col items-center justify-center px-6 min-h-0 pointer-events-none">
        {/* Glow behind penguin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[100px] rounded-full z-0" />
        
        {/* The Penguin */}
        <div className="relative w-full h-full max-h-[320px] flex items-center justify-center z-10 scale-110">
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedId}
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 15 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20, 
                mass: 1 
              }}
              src={selectedOutfit.image}
              alt={selectedOutfit.label}
              className="h-full w-auto object-contain drop-shadow-[0_45px_60px_rgba(0,0,0,0.5)]"
            />
          </AnimatePresence>
        </div>

        {/* The Stage/Pedestal */}
        <div className="relative -mt-16 w-48 h-12 z-0">
          <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-[100%] backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.4)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-[100%] blur-[2px]" />
        </div>
      </div>

      {/* ── Glassmorphism Wardrobe Footer ── */}
      <div className="relative z-20 flex flex-col h-[40dvh] bg-white/5 backdrop-blur-2xl border-t border-white/10 rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="flex-none flex items-center justify-between px-8 pt-6 pb-2">
           <div>
             <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Wardrobe</h2>
             <div className="h-1 w-8 bg-primary rounded-full mt-1.5 shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
           </div>
           <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{PENGUIN_OUTFITS.length} Items</span>
        </div>

        {/* Only this list should scroll */}
        <div className="flex-1 overflow-y-auto px-8 pb-32 pt-4 no-scrollbar touch-pan-y overscroll-contain">
          <div className="grid grid-cols-3 gap-4">
            {PENGUIN_OUTFITS.map((outfit, i) => {
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
                    "group relative aspect-square rounded-[1.5rem] border transition-all duration-300 flex flex-col items-center justify-center p-3 overflow-hidden",
                    isSelected 
                      ? "bg-white/15 border-white/40 ring-1 ring-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.3)]" 
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 active:scale-95"
                  )}
                >
                  {/* Item Image */}
                  <img src={outfit.image} className="w-full h-full object-contain pointer-events-none drop-shadow-md" />
                  
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg border border-white/20">
                      <Check className="w-3 h-3 text-white" strokeWidth={4} />
                    </div>
                  )}

                  {/* Gradient Glow on selection */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none" />
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
