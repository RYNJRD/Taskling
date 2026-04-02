import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, RotateCcw, Save, ShoppingBag, Star } from "lucide-react";
import { Link } from "wouter";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/store/useStore";
import { apiFetch } from "@/lib/apiFetch";
import {
  AVATAR_OPTIONS,
  BASE_SECTIONS,
  MALE_CLOTHING_SECTIONS,
  parseAvatarConfig,
  type AvatarConfig,
  type AvatarSection,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";

export default function Profile() {
  const { currentUser, setCurrentUser } = useStore();
  const { toast } = useToast();
  const [config, setConfig] = useState<AvatarConfig>(() => parseAvatarConfig(currentUser?.avatarConfig));

  const isMale = currentUser?.gender === "male";

  useEffect(() => {
    setConfig(parseAvatarConfig(currentUser?.avatarConfig));
  }, [currentUser?.avatarConfig]);

  const mutation = useMutation({
    mutationFn: async (nextConfig: AvatarConfig) => {
      const res = await apiFetch(buildUrl(api.users.updateAvatar.path, { id: currentUser?.id || 0 }), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarConfig: JSON.stringify(nextConfig) }),
      });
      if (!res.ok) throw new Error("Failed to save avatar");
      return res.json();
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      queryClient.invalidateQueries({ queryKey: [api.families.getUsers.path, user.familyId] });
      toast({ title: "Look saved", description: "Your avatar is ready for the next streak." });
    },
    onError: () => {
      toast({ title: "Could not save", description: "Try again in a moment.", variant: "destructive" });
    },
  });

  if (!currentUser) return null;

  function renderOptionGrid(section: AvatarSection) {
    const options = AVATAR_OPTIONS[section];
    const isImageSection = section === "jacket" || section === "pants";

    return (
      <div className={cn("grid gap-3", isImageSection ? "grid-cols-2" : "grid-cols-2")}>
        {options.map((option) => {
          const isSelected = config[section] === option.id;
          const isNone = option.id === "none";

          return (
            <button
              key={option.id}
              data-testid={`option-${section}-${option.id}`}
              onClick={() => setConfig((c) => ({ ...c, [section]: option.id }))}
              className={cn(
                "rounded-[1.5rem] border-2 bg-card text-left shadow-sm transition-all overflow-hidden",
                isSelected ? "border-primary ring-2 ring-primary/20" : "border-border",
              )}
            >
              {isImageSection && !isNone && option.image ? (
                <div className="relative">
                  <img
                    src={option.image}
                    alt={option.label}
                    className="w-full aspect-square object-contain bg-gradient-to-b from-gray-50 to-gray-100 p-2"
                  />
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="px-3 py-2">
                    <p className="font-bold text-sm truncate">{option.label}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{option.preview}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="font-bold text-sm">{option.label}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-background min-h-screen pb-32">
      {/* Points card */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 p-4 bg-gradient-to-br from-accent to-amber-400 rounded-[2rem] border-4 border-white shadow-xl text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Star size={60} className="fill-white" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Current balance</p>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-7 h-7 fill-yellow-200 text-yellow-200" />
          <span className="text-3xl font-black tracking-tighter">{currentUser.points || 0}</span>
        </div>
        <Link href={`/family/${currentUser.familyId}/rewards`}>
          <Button className="w-full h-11 bg-white text-accent hover:bg-white/90 rounded-xl font-black uppercase tracking-wider shadow-lg">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Browse rewards
          </Button>
        </Link>
      </motion.div>

      {/* Header + actions */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight mb-2">My Avatar</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
            Playful, quick, and made for mobile.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            data-testid="button-save-avatar"
            onClick={() => mutation.mutate(config)}
            className="rounded-xl font-bold"
            disabled={mutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-testid="button-reset-avatar"
            onClick={() => setConfig(parseAvatarConfig(currentUser.avatarConfig))}
            className="rounded-xl font-bold"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Avatar preview */}
      <div className="relative aspect-square w-full max-w-[280px] mx-auto mb-8 bg-gradient-to-b from-primary/10 via-background to-accent/10 rounded-[40px] flex items-center justify-center border-4 border-primary/10 shadow-inner overflow-hidden">
        <UserAvatar
          user={{ ...currentUser, avatarConfig: JSON.stringify(config) }}
          size="xl"
          className="bg-transparent border-none shadow-none"
        />
      </div>

      {/* Base avatar tabs */}
      <Tabs defaultValue="hair" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 border-2 border-muted w-full mb-6 grid grid-cols-4">
          {BASE_SECTIONS.map((section) => (
            <TabsTrigger
              key={section}
              value={section}
              data-testid={`tab-${section}`}
              className="rounded-xl font-black uppercase text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {section}
            </TabsTrigger>
          ))}
        </TabsList>

        {BASE_SECTIONS.map((section) => (
          <TabsContent key={section} value={section}>
            {renderOptionGrid(section)}
          </TabsContent>
        ))}
      </Tabs>

      {/* Male-only clothing section */}
      {isMale && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">👔</span>
            <div>
              <h2 className="text-xl font-black text-primary tracking-tight">Clothing</h2>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Suit collection</p>
            </div>
          </div>

          <Tabs defaultValue="jacket" className="w-full">
            <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 border-2 border-muted w-full mb-6 grid grid-cols-2">
              {MALE_CLOTHING_SECTIONS.map((section) => (
                <TabsTrigger
                  key={section}
                  value={section}
                  data-testid={`tab-clothing-${section}`}
                  className="rounded-xl font-black uppercase text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {section === "jacket" ? "Jackets" : "Pants"}
                </TabsTrigger>
              ))}
            </TabsList>

            {MALE_CLOTHING_SECTIONS.map((section) => (
              <TabsContent key={section} value={section}>
                {renderOptionGrid(section)}
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      )}
    </div>
  );
}
