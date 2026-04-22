import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { api, buildUrl } from "../../../shared/routes";
import { queryClient } from "../lib/queryClient";
import { useStore } from "../store/useStore";
import { apiFetch } from "../lib/apiFetch";
import {
  PENGUIN_OUTFITS,
  parseAvatarConfig,
  type AvatarConfig,
  type Rarity,
} from "../lib/avatar";
import { cn } from "../lib/utils";

const RARITY_COLORS: Record<Rarity, string> = {
  legendary: "#C9A84C",
  mythic: "#9B6FD4",
  rare: "#5B9BD5",
  common: "#AAAAAA",
};

export default function Profile() {
  const { currentUser, setCurrentUser } = useStore();
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

  const sortedOutfits = useMemo(() => {
    const weights: Record<Rarity, number> = { legendary: 3, mythic: 2, rare: 1, common: 0 };
    return [...PENGUIN_OUTFITS].sort((a, b) => weights[b.rarity] - weights[a.rarity]);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white font-sans overflow-hidden select-none">
      {/* ── Character Area (flex: 3) ── */}
      <div 
        className="flex-[3] relative flex items-center justify-center overflow-hidden"
        style={{
          background: "radial-gradient(circle, #FFF9F2 0%, #F3F1FF 70%, #E8EBF2 100%)"
        }}
      >
        <div className="relative flex flex-col items-center">
          {/* Character Image with Cross-fade */}
          <div className="relative w-[180px] h-[180px] flex items-center justify-center z-10">
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                src={selectedOutfit.image}
                className="w-full h-full object-contain"
                alt="Character"
              />
            </AnimatePresence>
          </div>
          
          {/* Soft Ellipse Shadow */}
          <div 
            className="w-[120px] h-[24px] bg-white rounded-[100%] opacity-30 mt-[-12px]" 
            style={{ filter: "blur(12px)" }}
          />
        </div>
      </div>

      {/* ── Wardrobe Panel (flex: 2) ── */}
      <div 
        className="flex-[2] relative bg-white rounded-t-[28px] flex flex-col overflow-hidden z-20"
        style={{
          boxShadow: "0 -8px 16px rgba(0, 0, 0, 0.06)"
        }}
      >
        {/* Drag Indicator */}
        <div className="flex justify-center pt-[10px] pb-[4px]">
          <div className="w-[36px] h-[4px] bg-[#E0E0E0] rounded-[2px]" />
        </div>

        {/* Panel Header */}
        <div className="px-6 pt-2 pb-3">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[11px] font-bold tracking-[1.5px] text-[#111] uppercase">Wardrobe</h2>
            <span className="text-[10px] text-[#AAAAAA]">{PENGUIN_OUTFITS.length} ITEMS</span>
          </div>
          <div className="h-[1px] bg-[#F0F0F0] w-full" />
        </div>

        {/* Costume Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 no-scrollbar">
          <div className="grid grid-cols-3 gap-3 pt-2">
            {sortedOutfits.map((outfit) => {
              const isSelected = selectedId === outfit.id;
              
              return (
                <motion.button
                  key={outfit.id}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onClick={() => {
                    if (!outfit.comingSoon) {
                      const nextConfig = { outfit: outfit.id };
                      setConfig(nextConfig);
                      mutation.mutate(nextConfig);
                    }
                  }}
                  className={cn(
                    "group relative aspect-square rounded-[16px] border bg-[#FAFAFA] p-2.5 flex flex-col items-center justify-between transition-colors duration-150 overflow-hidden",
                    isSelected ? "border-[#111] border-[2px]" : "border-[#F0F0F0]"
                  )}
                >
                  {/* Luxury Selection Indicator */}
                  {isSelected && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-2 right-2 w-[16px] h-[16px] bg-[#111] rounded-full flex items-center justify-center z-10"
                    >
                      <Check className="w-[10px] h-[10px] text-white" strokeWidth={4} />
                    </motion.div>
                  )}

                  {/* Outfit Image */}
                  <div className="flex-1 w-full flex items-center justify-center">
                    <img 
                      src={outfit.image} 
                      className="max-w-full max-h-full object-contain"
                      alt={outfit.label}
                    />
                  </div>

                  {/* Rarity Label */}
                  <span 
                    className="text-[9px] font-semibold tracking-[0.8px] uppercase mt-1"
                    style={{ color: RARITY_COLORS[outfit.rarity] }}
                  >
                    {outfit.rarity}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
