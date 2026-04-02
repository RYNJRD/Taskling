import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, Shirt, Smile } from "lucide-react";
import { useLocation } from "wouter";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/store/useStore";
import { apiFetch } from "@/lib/apiFetch";
import {
  HEAD_SUB_SECTIONS,
  CLOTHING_SUB_SECTIONS,
  MALE_ONLY_SECTIONS,
  AVATAR_ITEMS,
  SUB_SECTION_LABELS,
  SUB_SECTION_ICONS,
  parseAvatarConfig,
  type AvatarConfig,
  type AvatarSubSection,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";
import maleModelImg from "@assets/d228ba9d-e9b6-44a6-a3bf-ba22f99114fd_removalai_preview_1775090740007.png";
import femaleModelImg from "@assets/c033f10f-b630-4dab-b599-e1e948a32c27_removalai_preview_1775090736187.png";

type AvatarCategory = "head" | "clothing";

export default function Profile() {
  const { currentUser, setCurrentUser } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [config, setConfig] = useState<AvatarConfig>(() =>
    parseAvatarConfig(currentUser?.avatarConfig),
  );
  const [activeCategory, setActiveCategory] = useState<AvatarCategory>("head");
  const [activeSubSection, setActiveSubSection] = useState<AvatarSubSection>("hair");

  const isMale = currentUser?.gender !== "female";
  const isFemale = currentUser?.gender === "female";
  const baseModel = isFemale ? femaleModelImg : maleModelImg;

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
      toast({ title: "Look saved!", description: "Your character is ready." });
    },
    onError: () => {
      toast({ title: "Could not save", description: "Try again in a moment.", variant: "destructive" });
    },
  });

  if (!currentUser) return null;

  const headSections = HEAD_SUB_SECTIONS.filter(
    (s) => !MALE_ONLY_SECTIONS.includes(s) || isMale,
  );
  const clothingSections = CLOTHING_SUB_SECTIONS;

  const currentSections = activeCategory === "head" ? headSections : clothingSections;
  const items = AVATAR_ITEMS[activeSubSection] ?? [];

  function handleCategoryChange(cat: AvatarCategory) {
    setActiveCategory(cat);
    const defaultSub = cat === "head" ? headSections[0] : clothingSections[0];
    setActiveSubSection(defaultSub);
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-background">

      {/* ── Slim top bar ── */}
      <div className="flex-none flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => setLocation(-1 as any)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-bold">Back</span>
        </button>
        <h1 className="text-base font-black text-primary tracking-tight">My Character</h1>
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
      </div>

      {/* ── Character preview ── */}
      <div className="flex-none relative flex items-end justify-center bg-gradient-to-b from-primary/8 via-background/50 to-background overflow-hidden"
        style={{ height: "38vh" }}>
        {/* Decorative glow behind character */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-primary/10 rounded-full blur-3xl" />
        <motion.img
          key={baseModel}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          src={baseModel}
          alt="Character"
          draggable={false}
          className="relative z-10 h-full w-auto object-contain object-bottom select-none pointer-events-none drop-shadow-2xl"
        />
      </div>

      {/* ── Wardrobe panel ── */}
      <div className="flex-1 min-h-0 flex flex-col bg-card rounded-t-[2rem] shadow-2xl border-t border-border/60 overflow-hidden">

        {/* Main category pills */}
        <div className="flex-none px-4 pt-4 pb-0">
          <div className="flex gap-2 bg-muted/60 rounded-2xl p-1">
            {(["head", "clothing"] as AvatarCategory[]).map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  data-testid={`tab-category-${cat}`}
                  onClick={() => handleCategoryChange(cat)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black uppercase tracking-wide transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {cat === "head" ? (
                    <Smile className="w-4 h-4" />
                  ) : (
                    <Shirt className="w-4 h-4" />
                  )}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-section tabs — horizontal scroll */}
        <div className="flex-none pt-3 pb-1">
          <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
            <AnimatePresence mode="wait">
              {currentSections.map((sub) => {
                const isActive = activeSubSection === sub;
                return (
                  <button
                    key={sub}
                    data-testid={`tab-subsection-${sub}`}
                    onClick={() => setActiveSubSection(sub)}
                    className={cn(
                      "flex-none flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                      isActive
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/60",
                    )}
                  >
                    <span className="text-base leading-none">{SUB_SECTION_ICONS[sub]}</span>
                    <span>{SUB_SECTION_LABELS[sub]}</span>
                  </button>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Thin divider */}
          <div className="mx-4 mt-1 h-px bg-border/60" />
        </div>

        {/* Items area — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-28">
          {items.length === 0 ? (
            <motion.div
              key={activeSubSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="text-5xl mb-4 opacity-40">{SUB_SECTION_ICONS[activeSubSection]}</div>
              <p className="font-black text-base text-foreground/30 uppercase tracking-widest mb-1">
                Coming soon
              </p>
              <p className="text-xs text-muted-foreground/60 font-medium max-w-[200px]">
                {SUB_SECTION_LABELS[activeSubSection]} options are on their way!
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeSubSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-3 gap-3 pt-3"
            >
              {items.map((item) => (
                <button
                  key={item.id}
                  data-testid={`item-${activeSubSection}-${item.id}`}
                  onClick={() => setConfig((c) => ({ ...c, [activeSubSection]: item.id }))}
                  className={cn(
                    "relative aspect-square rounded-2xl border-2 overflow-hidden transition-all bg-muted/40",
                    config[activeSubSection] === item.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border/60 hover:border-primary/30",
                  )}
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.label}
                      className="w-full h-full object-contain p-2"
                    />
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-background/80 backdrop-blur-sm py-1 px-2">
                    <p className="text-[10px] font-bold truncate text-center">{item.label}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
