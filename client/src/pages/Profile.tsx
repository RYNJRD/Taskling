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
  RARITY_META,
  type Rarity,
} from "../lib/avatar";
import { cn } from "../lib/utils";

const RARITY_GLOW: Record<Rarity, string> = {
  legendary: "neon-halo-gold",
  mythic: "neon-halo-purple",
  rare: "neon-halo-blue",
  common: "",
};

const RARITY_BG_GLOW: Record<Rarity, string> = {
  legendary: "rgba(255, 215, 0, 0.15)",
  mythic: "rgba(168, 85, 247, 0.15)",
  rare: "rgba(56, 189, 248, 0.15)",
  common: "rgba(255, 255, 255, 0.05)",
};

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

  // Sort outfits by rarity rarity: legendary > mythic > rare > common
  const sortedOutfits = useMemo(() => {
    const weights: Record<Rarity, number> = { legendary: 3, mythic: 2, rare: 1, common: 0 };
    return [...PENGUIN_OUTFITS].sort((a, b) => weights[b.rarity] - weights[a.rarity]);
  }, []);

  const meta = RARITY_META[selectedOutfit.rarity];

  return (
    <div className="h-full transition-colors duration-700 overflow-hidden select-none flex flex-col font-sans bg-tab-profile">
      
      {/* ── Top Section (flex: 3) ── */}
      <div className="flex-[3] flex flex-col pt-6 px-5 min-h-0">
        {/* Top Header */}
        <div className="flex items-center justify-between h-10 mb-5">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none glass"
                style={{ boxShadow: '0 0 12px rgba(var(--glow-primary), 0.2)' }}>
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-xl font-black leading-none text-indigo-950 dark:text-white">{currentUser.username}</h1>
                <p className="text-[9px] font-black uppercase tracking-wider text-indigo-900/70 dark:text-white/60 mt-1">Explorer Level 1</p>
              </div>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center active:scale-95 transition-all duration-300 flex-none"
          >
              <SettingsIcon className="w-5 h-5 text-foreground/50" />
          </button>
        </div>

        {/* Stats Row - Frosted Glass Gems */}
        <div className="flex justify-center gap-3 mb-4 shrink-0 mx-auto w-full max-w-[260px]">
            <div className="glass-card flex-1 rounded-2xl py-2 flex flex-col items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400 mb-0.5" style={{ filter: 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.5))' }} />
              <span className="font-display font-black text-[13px] text-foreground">{currentUser.points}</span>
            </div>
            <div className="glass-card flex-1 rounded-2xl py-2 flex flex-col items-center justify-center">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-400 mb-0.5" style={{ filter: 'drop-shadow(0 0 4px rgba(249, 115, 22, 0.5))' }} />
              <span className="font-display font-black text-[13px] text-foreground">{currentUser.streak || 0}</span>
            </div>
            <div className="glass-card flex-1 rounded-2xl py-2 flex flex-col items-center justify-center">
              <span className="text-[14px] font-black text-muted-foreground/40 mb-0.5 leading-none">#</span>
              <span className="font-display font-black text-[13px] text-foreground">1</span>
            </div>
        </div>

        {/* Character Display Area (Proportional) */}
        <div className="flex-1 relative flex flex-col items-center justify-center min-h-0 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedOutfit.rarity}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              className={cn(
                "absolute w-[180%] aspect-square blur-[120px] rounded-full z-0",
                selectedOutfit.rarity === "legendary" ? "bg-amber-400/30" :
                selectedOutfit.rarity === "mythic" ? "bg-purple-500/30" :
                selectedOutfit.rarity === "rare" ? "bg-blue-400/30" : "bg-slate-400/20"
              )}
            />
          </AnimatePresence>
          <div className="relative w-full h-[92%] flex items-center justify-center z-10">
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedId}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                src={selectedOutfit.image}
                className="max-h-full w-auto object-contain drop-shadow-xl"
                style={{ filter: `drop-shadow(0 0 20px ${RARITY_BG_GLOW[selectedOutfit.rarity]})` }}
              />
            </AnimatePresence>
          </div>
          <div className="w-32 h-4 rounded-[100%] blur-[2px] -mt-4" style={{ background: 'rgba(255,255,255,0.03)' }} />
        </div>
      </div>

      {/* ── Bottom Section (flex: 2) ── */}
      <div className="flex-[2] relative rounded-t-[3.5rem] flex flex-col overflow-hidden mx-1 mb-[-4px]"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
        }}
      >
        {/* Inside Trace - rarity glow */}
        <div className={cn(
          "absolute inset-[6px] rounded-t-[3.1rem] pointer-events-none z-10 transition-all duration-500",
          meta.border ? "border" : "",
        )} style={{
          borderColor: selectedOutfit.rarity === "legendary" ? 'rgba(255, 215, 0, 0.25)' :
                       selectedOutfit.rarity === "mythic" ? 'rgba(168, 85, 247, 0.25)' :
                       selectedOutfit.rarity === "rare" ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
          boxShadow: selectedOutfit.rarity !== "common" 
            ? `inset 0 0 30px ${RARITY_BG_GLOW[selectedOutfit.rarity]}` 
            : 'none',
        }} />

        {/* Panel Header */}
        <div className="px-8 pt-6 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.1em] text-foreground/90">Wardrobe</h2>
              <div className="h-1.5 w-8 bg-primary rounded-full mt-1" style={{ boxShadow: '0 0 8px rgba(var(--glow-primary), 0.5)' }} />
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{PENGUIN_OUTFITS.length} Items</p>
          </div>
        </div>

        {/* Costume Grid (Internally Scrollable ViewPort) */}
        <div className="flex-1 overflow-y-auto px-6 pb-28 no-scrollbar mask-bottom-fade">
          <div className="grid grid-cols-3 gap-3 pt-4">
            {sortedOutfits.map((outfit) => {
              const isSelected = selectedId === outfit.id;
              const outfitMeta = RARITY_META[outfit.rarity];
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
                    "group relative aspect-square rounded-[1.25rem] transition-all duration-300 flex flex-col items-center justify-center p-2.5 overflow-hidden active:scale-95",
                    isSelected && RARITY_GLOW[outfit.rarity],
                  )}
                  style={{
                    background: isSelected ? RARITY_BG_GLOW[outfit.rarity] : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${isSelected 
                      ? (outfit.rarity === "legendary" ? 'rgba(255, 215, 0, 0.4)' : 
                         outfit.rarity === "mythic" ? 'rgba(168, 85, 247, 0.4)' : 
                         outfit.rarity === "rare" ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.15)')
                      : 'rgba(255, 255, 255, 0.06)'}`,
                  }}
                >
                  {/* Item Image */}
                  <div className="relative w-[88%] h-[88%] flex items-center justify-center">
                    <img 
                      src={outfit.image} 
                      className={cn(
                        "w-full h-full object-contain pointer-events-none drop-shadow-md transition-transform duration-300",
                        isSelected && "scale-110"
                      )} 
                    />
                  </div>

                  {/* Selection Badge */}
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-lg flex items-center justify-center z-20"
                      style={{
                        background: 'rgba(var(--glow-primary), 0.8)',
                        boxShadow: '0 0 8px rgba(var(--glow-primary), 0.5)',
                      }}
                    >
                      <Check className="w-3 h-3 text-white" strokeWidth={4} />
                    </motion.div>
                  )}

                  {/* Rarity Label (Bottom) */}
                  <div className="absolute bottom-0 w-full py-1 text-[7px] font-black uppercase tracking-widest text-center"
                    style={{
                      background: isSelected ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)',
                      backdropFilter: 'blur(4px)',
                      color: outfit.rarity === "legendary" ? 'rgb(250, 204, 21)' :
                             outfit.rarity === "mythic" ? 'rgb(192, 132, 252)' :
                             outfit.rarity === "rare" ? 'rgb(96, 165, 250)' : 'rgba(255, 255, 255, 0.4)',
                    }}
                  >
                    {outfit.rarity}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

