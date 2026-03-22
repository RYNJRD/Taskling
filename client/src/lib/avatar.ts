export type AvatarSection = "hair" | "top" | "bottom" | "accessory";

export type AvatarOption = {
  id: string;
  label: string;
  preview: string;
  className: string;
};

export const AVATAR_OPTIONS: Record<AvatarSection, AvatarOption[]> = {
  hair: [
    { id: "puff", label: "Puff", preview: "🌀", className: "bg-amber-700 rounded-t-[2rem]" },
    { id: "spiky", label: "Spiky", preview: "✨", className: "bg-slate-800 clip-spiky" },
    { id: "bob", label: "Bob", preview: "💫", className: "bg-amber-900 rounded-[1.4rem]" },
    { id: "waves", label: "Waves", preview: "🌊", className: "bg-orange-500 rounded-[1.8rem]" },
  ],
  top: [
    { id: "hoodie-blue", label: "Blue Hoodie", preview: "🩵", className: "bg-sky-500" },
    { id: "tee-green", label: "Green Tee", preview: "💚", className: "bg-emerald-500" },
    { id: "sweater-sun", label: "Sunny Sweater", preview: "💛", className: "bg-yellow-400" },
    { id: "jacket-plum", label: "Plum Jacket", preview: "💜", className: "bg-fuchsia-500" },
  ],
  bottom: [
    { id: "joggers-navy", label: "Navy Joggers", preview: "🔵", className: "bg-slate-700" },
    { id: "shorts-coral", label: "Coral Shorts", preview: "🧡", className: "bg-orange-400" },
    { id: "leggings-plum", label: "Plum Leggings", preview: "🪻", className: "bg-violet-500" },
    { id: "jeans-indigo", label: "Indigo Jeans", preview: "🫐", className: "bg-indigo-500" },
  ],
  accessory: [
    { id: "star-clip", label: "Star Clip", preview: "⭐", className: "text-yellow-400" },
    { id: "headphones", label: "Headphones", preview: "🎧", className: "text-slate-700" },
    { id: "glasses", label: "Glasses", preview: "🕶️", className: "text-slate-700" },
    { id: "sparkle", label: "Sparkle", preview: "✨", className: "text-primary" },
  ],
};

export type AvatarConfig = Partial<Record<AvatarSection, string | null>>;

export function parseAvatarConfig(raw?: string | null): AvatarConfig {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AvatarConfig;
  } catch {
    return {};
  }
}
