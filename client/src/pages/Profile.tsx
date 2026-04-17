import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Settings as SettingsIcon, Check } from "lucide-react";
import { useLocation } from "wouter";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { useStore } from "@/store/useStore";
import { apiFetch } from "@/lib/apiFetch";
import {
  PENGUIN_OUTFITS,
  parseAvatarConfig,
  type AvatarConfig,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";

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
    onError: () => {
      // Failed silently for better UX in auto-save, but could add a small indicator
    },
  });

  if (!currentUser) return null;

  const selectedId = config.outfit ?? "classic";
  const selectedOutfit = useMemo(
    () => PENGUIN_OUTFITS.find((o) => o.id === selectedId) ?? PENGUIN_OUTFITS[0],
    [selectedId],
  );
  const settingsPath = family?.id ? `/family/${family.id}/settings` : "/get-started";

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-tab-profile">

      {/* ── Top bar ── */}
      <div className="flex-none flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-primary tracking-tight">Chorely</h1>
          <span className="text-xs font-bold text-foreground/50 bg-muted/80 rounded-lg px-2 py-0.5">My Character</span>
        </div>
      </div>

      {/* ── Character preview ── */}
      <div
        className="flex-none relative flex items-end justify-center bg-gradient-to-b from-primary/8 via-background/50 to-background overflow-hidden"
        style={{ height: "38vh" }}
      >
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-primary/10 rounded-full blur-3xl" />
        <AnimatePresence mode="wait">
          <motion.img
            key={selectedId}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            src={selectedOutfit.image}
            alt={selectedOutfit.label}
            draggable={false}
            className="relative z-10 h-full w-auto object-contain object-bottom select-none pointer-events-none drop-shadow-2xl"
          />
        </AnimatePresence>
      </div>

      {/* ── Outfit picker panel ── */}
      <div className="flex-1 min-h-0 flex flex-col bg-card rounded-t-[2rem] shadow-2xl border-t-2 border-x-2 border-slate-300/70 dark:border-slate-700/70 overflow-hidden">
        <div className="flex-none px-4 pt-4 pb-3">
          <h2 className="font-bold text-sm text-foreground uppercase tracking-widest">Choose Your Penguin</h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">More outfits coming soon!</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-28">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            {PENGUIN_OUTFITS.map((outfit, i) => {
              const isSelected = selectedId === outfit.id;
              return (
                <motion.button
                  key={outfit.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  data-testid={`outfit-${outfit.id}`}
                  disabled={outfit.comingSoon}
                  onClick={() => {
                    if (!outfit.comingSoon) {
                      const nextConfig = { outfit: outfit.id };
                      setConfig(nextConfig);
                      mutation.mutate(nextConfig);
                    }
                  }}
                  className={cn(
                    "relative aspect-square rounded-2xl border-2 overflow-hidden transition-all flex flex-col shadow-sm",
                    outfit.comingSoon
                      ? "border-slate-300/40 dark:border-slate-700/40 bg-muted/20 opacity-60 cursor-not-allowed"
                      : isSelected
                      ? "border-primary border-[3px] ring-2 ring-primary/30 bg-primary/5 shadow-md shadow-primary/15"
                      : "border-slate-300 dark:border-slate-600 hover:border-primary/50 bg-muted/30 active:scale-[0.97]",
                  )}
                >
                  <div className="flex-1 flex items-end justify-center px-2 pt-2 overflow-hidden">
                    <img
                      src={outfit.image}
                      alt={outfit.label}
                      className={cn(
                        "h-full w-auto object-contain object-bottom select-none pointer-events-none",
                        outfit.comingSoon && "grayscale opacity-50",
                      )}
                    />
                  </div>
                  <div className={cn("flex-none py-1.5 px-2 text-center", isSelected ? "bg-primary/10" : "bg-background/60 backdrop-blur-sm")}>
                    <p className={cn("text-[10px] font-bold truncate", isSelected ? "text-primary" : "text-foreground/70")}>
                      {outfit.label}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  {outfit.comingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-background/80 backdrop-blur-sm rounded-xl px-2 py-1 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Soon</span>
                      </div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
