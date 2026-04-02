import charcoalJacketImg from "@assets/Gemini_Generated_Image_hhpzoohhpzoohhpz_1775089122027.png";
import navyJacketImg from "@assets/Gemini_Generated_Image_yj9ccsyj9ccsyj9c_1775089122028.png";
import greenJacketImg from "@assets/Gemini_Generated_Image_rt5ankrt5ankrt5a_1775089122029.png";
import maroonJacketImg from "@assets/Gemini_Generated_Image_elgqwielgqwielgq_1775089122030.png";

import charcoalPantsImg from "@assets/Gemini_Generated_Image_vxgzzdvxgzzdvxgz_1775089122026.png";
import navyPantsImg from "@assets/Gemini_Generated_Image_bn5eq4bn5eq4bn5e_1775089122028.png";
import greenPantsImg from "@assets/Gemini_Generated_Image_uejso1uejso1uejs_1775089122029.png";
import maroonPantsImg from "@assets/Gemini_Generated_Image_icusr8icusr8icus_1775089122030.png";

export type AvatarSection = "hair" | "top" | "bottom" | "accessory" | "jacket" | "pants";

export type AvatarOption = {
  id: string;
  label: string;
  preview: string;
  className: string;
  image?: string;
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
  jacket: [
    { id: "none", label: "None", preview: "🚫", className: "" },
    { id: "jacket-charcoal", label: "Charcoal Suit", preview: "🩶", className: "", image: charcoalJacketImg },
    { id: "jacket-navy", label: "Navy Suit", preview: "💙", className: "", image: navyJacketImg },
    { id: "jacket-green", label: "Green Tuxedo", preview: "💚", className: "", image: greenJacketImg },
    { id: "jacket-maroon", label: "Maroon Suit", preview: "🍷", className: "", image: maroonJacketImg },
  ],
  pants: [
    { id: "none", label: "None", preview: "🚫", className: "" },
    { id: "pants-charcoal", label: "Charcoal Trousers", preview: "🩶", className: "", image: charcoalPantsImg },
    { id: "pants-navy", label: "Navy Trousers", preview: "💙", className: "", image: navyPantsImg },
    { id: "pants-green", label: "Forest Trousers", preview: "💚", className: "", image: greenPantsImg },
    { id: "pants-maroon", label: "Maroon Trousers", preview: "🍷", className: "", image: maroonPantsImg },
  ],
};

export const BASE_SECTIONS: AvatarSection[] = ["hair", "top", "bottom", "accessory"];
export const MALE_CLOTHING_SECTIONS: AvatarSection[] = ["jacket", "pants"];

export type AvatarConfig = Partial<Record<AvatarSection, string | null>>;

export function parseAvatarConfig(raw?: string | null): AvatarConfig {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AvatarConfig;
  } catch {
    return {};
  }
}
