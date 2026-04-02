import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Save, RotateCcw, Check, X, Lock } from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/store/useStore";
import { apiFetch } from "@/lib/apiFetch";
import {
  PENGUIN_OUTFITS,
  parseAvatarConfig,
  type AvatarConfig,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";

export default function Profile() {
  const { currentUser, setCurrentUser } = useStore();
  const { toast } = useToast();

  const [config, setConfig] = useState<AvatarConfig>(() =>
    parseAvatarConfig(currentUser?.avatarConfig),
  );
  const [confirmReset, setConfirmReset] = useState(false);

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
      toast({ title: "Character saved!", description: "Your penguin is ready." });
    },
    onError: () => {
      toast({ title: "Could not save", description: "Try again in a moment.", variant: "destructive" });
    },
  });

  if (!currentUser) return null;

  const selectedId = config.outfit ?? "classic";
  const selectedOutfit = PENGUIN_OUTFITS.find((o) => o.id === selectedId) ?? PENGUIN_OUTFITS[0];

  function handleReset() {
    setConfig({});
    setConfirmReset(false);
    toast({ title: "Character reset", description: "Back to your classic penguin." });
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-background">

      {/* ── Top bar ── */}
      <div className="flex-none flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="text-base font-black text-primary tracking-tight">My Character</h1>

        <AnimatePresence mode="wait">
          {confirmReset ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2"
            >
              <span className="text-xs font-bold text-muted-foreground">Reset look?</span>
              <button
                data-testid="button-confirm-reset"
                onClick={handleReset}
                className="flex items-center gap-1 bg-destructive text-destructive-foreground rounded-xl h-8 px-3 text-xs font-bold"
              >
                <Check className="w-3.5 h-3.5" />
                Yes
              </button>
              <button
                data-testid="button-cancel-reset"
                onClick={() => setConfirmReset(false)}
                className="flex items-center gap-1 bg-muted text-muted-foreground rounded-xl h-8 px-3 text-xs font-bold hover:bg-muted/80"
              >
                <X className="w-3.5 h-3.5" />
                No
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2"
            >
              <button
                data-testid="button-undo-avatar"
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground rounded-xl h-8 px-3 text-xs font-bold border border-border/60 hover:bg-muted/60 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Undo
              </button>
              <Button
                size="sm"
                data-testid="button-save-avatar"
                onClick={() => mutation.mutate(config)}
                disabled={mutation.isPending}
                className="rounded-xl font-bold h-8 px-3 text-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
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
      <div className="flex-1 min-h-0 flex flex-col bg-card rounded-t-[2rem] shadow-2xl border-t border-border/60 overflow-hidden">

        <div className="flex-none px-4 pt-4 pb-3">
          <h2 className="font-black text-sm text-foreground uppercase tracking-widest">Choose Your Penguin</h2>
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
                  onClick={() => !outfit.comingSoon && setConfig({ outfit: outfit.id })}
                  className={cn(
                    "relative aspect-square rounded-2xl border-2 overflow-hidden transition-all flex flex-col",
                    outfit.comingSoon
                      ? "border-border/40 bg-muted/20 opacity-60 cursor-not-allowed"
                      : isSelected
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                      : "border-border/60 hover:border-primary/40 bg-muted/30 active:scale-[0.97]",
                  )}
                >
                  {/* Penguin image */}
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

                  {/* Label strip */}
                  <div
                    className={cn(
                      "flex-none py-1.5 px-2 text-center",
                      isSelected ? "bg-primary/10" : "bg-background/60 backdrop-blur-sm",
                    )}
                  >
                    <p className={cn("text-[10px] font-black truncate", isSelected ? "text-primary" : "text-foreground/70")}>
                      {outfit.label}
                    </p>
                  </div>

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}

                  {/* Coming soon lock */}
                  {outfit.comingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-background/80 backdrop-blur-sm rounded-xl px-2 py-1 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wide">Soon</span>
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
