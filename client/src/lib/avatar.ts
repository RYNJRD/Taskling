import penguinBaseImg from "@assets/0d1f6a25-4983-496c-a1e9-cf33a6774d85_removalai_preview_1775145431205.png";
import penguinTuxedoImg from "@assets/image_1775148166336.png";

export type PenguinOutfit = {
  id: string;
  label: string;
  image: string;
  comingSoon?: boolean;
};

export const PENGUIN_OUTFITS: PenguinOutfit[] = [
  { id: "classic",    label: "Classic",    image: penguinBaseImg },
  { id: "tuxedo",    label: "Tuxedo",     image: penguinTuxedoImg },
  { id: "superhero", label: "Superhero",  image: penguinBaseImg, comingSoon: true },
  { id: "pirate",    label: "Pirate",     image: penguinBaseImg, comingSoon: true },
  { id: "astronaut", label: "Astronaut",  image: penguinBaseImg, comingSoon: true },
  { id: "chef",      label: "Chef",       image: penguinBaseImg, comingSoon: true },
];

export const OUTFIT_MAP: Record<string, string> = Object.fromEntries(
  PENGUIN_OUTFITS.map((o) => [o.id, o.image]),
);

export type AvatarConfig = { outfit?: string | null };

export function parseAvatarConfig(raw?: string | null): AvatarConfig {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AvatarConfig;
  } catch {
    return {};
  }
}

export function getOutfitImage(avatarConfig?: string | null): string {
  const config = parseAvatarConfig(avatarConfig);
  if (config.outfit && OUTFIT_MAP[config.outfit]) {
    return OUTFIT_MAP[config.outfit];
  }
  return penguinBaseImg;
}
