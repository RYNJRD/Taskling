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
    <div className="h-full bg-background text-foreground overflow-hidden select-none flex flex-col font-sans pb-32">
      
      {/* ── Top Section (flex: 3) ── */}
      <div className="flex-[3] flex flex-col pt-6 px-5 min-h-0">
        {/* Top Header */}
        <div className="flex items-center justify-between h-10 mb-5">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border-[2.5px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center flex-none">
                <Trophy className="w-5 h-5 text-black" />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-xl font-black leading-none text-black">{currentUser.username}</h1>
                <p className="text-[9px] font-black uppercase tracking-wider text-black/50 mt-1">Explorer Level 1</p>
              </div>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 rounded-xl bg-white border-[2.5px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex-none"
          >
              <SettingsIcon className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4 shrink-0">
            <div className="bg-white border-[2.5px] border-black rounded-xl py-2 flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span className="font-display font-black text-sm text-black">{currentUser.points}</span>
            </div>
            <div className="bg-white border-[2.5px] border-black rounded-xl py-2 flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-600" />
              <span className="font-display font-black text-sm text-black">{currentUser.streak || 0}</span>
            </div>
            <div className="bg-white border-[2.5px] border-black rounded-xl py-2 flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-[10px] font-black text-black opacity-35">#</span>
              <span className="font-display font-black text-sm text-black">1</span>
            </div>
        </div>

        {/* Character Display Area (Proportional) */}
        <div className="flex-1 relative flex flex-col items-center justify-center min-h-0 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedOutfit.rarity}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              className={cn(
                "absolute w-[150%] aspect-square blur-[100px] rounded-full z-0",
                selectedOutfit.rarity === "legendary" ? "bg-amber-400" :
                selectedOutfit.rarity === "mythic" ? "bg-purple-500" :
                selectedOutfit.rarity === "rare" ? "bg-blue-400" : "bg-slate-400"
              )}
            />
          </AnimatePresence>
          <div className="relative w-full h-[85%] flex items-center justify-center z-10">
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedId}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                src={selectedOutfit.image}
                className="max-h-full w-auto object-contain drop-shadow-xl"
              />
            </AnimatePresence>
          </div>
          <div className="w-24 h-4 bg-black/5 rounded-[100%] blur-[2px] -mt-4" />
        </div>
      </div>

      {/* ── Bottom Section (flex: 2) ── */}
      <div className="flex-[2] bg-white border-t-[5px] border-x-[5px] border-black rounded-t-[3.5rem] shadow-[0_-15px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden mx-1 mb-[-4px]">
        {/* Panel Header */}
        <div className="px-8 pt-6 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.1em] text-black">Wardrobe</h2>
              <div className="h-1.5 w-8 bg-black rounded-full mt-1" />
            </div>
            <p className="text-[10px] font-black text-black/25 uppercase tracking-widest">{PENGUIN_OUTFITS.length} Items</p>
          </div>
        </div>

        {/* Costume Grid (Internally Scrollable ViewPort) */}
        <div className="flex-1 overflow-y-auto px-7 pb-10 no-scrollbar">
          <div className="grid grid-cols-4 gap-4 pt-1">
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
                    "group relative aspect-square rounded-[1.8rem] border-[3.5px] transition-all duration-200 flex flex-col items-center justify-center p-2 overflow-hidden",
                    isSelected 
                      ? "border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
                      : "bg-slate-50 border-transparent hover:bg-slate-100",
                    isSelected && outfit.rarity !== "common" && `bg-gradient-to-tr ${outfit.rarity === "legendary" ? "from-amber-50 to-white" : outfit.rarity === "mythic" ? "from-purple-50 to-white" : "from-blue-50 to-white"}`
                  )}
                >
                  <div className={cn(
                      "absolute inset-0 border-[3px] rounded-[inherit] pointer-events-none opacity-40",
                      outfitMeta.border
                  )} />
                  <img src={outfit.image} className="w-[85%] h-[85%] object-contain pointer-events-none drop-shadow-sm" />
                  {isSelected && (
                    <div className={cn(
                        "absolute top-1.5 right-1.5 w-5 h-5 rounded-full border-[2px] border-black flex items-center justify-center shadow-sm",
                        outfitMeta.bg
                    )}>
                      <Check className="w-3 h-3 text-white" strokeWidth={5} />
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

