export type HeadSubSection = "hair" | "face" | "eyebrows" | "eyes" | "beard";
export type ClothingSubSection = "jacket" | "pants" | "shoes" | "hat" | "glasses" | "accessories";
export type AvatarSubSection = HeadSubSection | ClothingSubSection;

export const HEAD_SUB_SECTIONS: HeadSubSection[] = ["hair", "face", "eyebrows", "eyes", "beard"];
export const CLOTHING_SUB_SECTIONS: ClothingSubSection[] = ["jacket", "pants", "shoes", "hat", "glasses", "accessories"];

export const MALE_ONLY_SECTIONS: AvatarSubSection[] = ["beard"];

export type AvatarItem = {
  id: string;
  label: string;
  image?: string;
  color?: string;
  preview?: string;
};

export const AVATAR_ITEMS: Record<AvatarSubSection, AvatarItem[]> = {
  hair: [],
  face: [],
  eyebrows: [],
  eyes: [],
  beard: [],
  jacket: [],
  pants: [],
  shoes: [],
  hat: [],
  glasses: [],
  accessories: [],
};

export const SUB_SECTION_LABELS: Record<AvatarSubSection, string> = {
  hair: "Hair",
  face: "Face",
  eyebrows: "Eyebrows",
  eyes: "Eyes",
  beard: "Beard",
  jacket: "Jacket",
  pants: "Pants",
  shoes: "Shoes",
  hat: "Hat",
  glasses: "Glasses",
  accessories: "Accessories",
};

export const SUB_SECTION_ICONS: Record<AvatarSubSection, string> = {
  hair: "💇",
  face: "🙂",
  eyebrows: "〰️",
  eyes: "👁️",
  beard: "🧔",
  jacket: "🧥",
  pants: "👖",
  shoes: "👟",
  hat: "🧢",
  glasses: "🕶️",
  accessories: "💍",
};

export type AvatarConfig = Partial<Record<AvatarSubSection, string | null>>;

export function parseAvatarConfig(raw?: string | null): AvatarConfig {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AvatarConfig;
  } catch {
    return {};
  }
}
