import penguinBaseImg from "@assets/base_penguin.png";
import penguinCoatImg from "@assets/coat_penguin.png";
import penguinSuitImg from "@assets/suit_penguin.png";
import penguinPirateImg from "@assets/pirate_penguin.png";
import penguinAstronautImg from "@assets/astronaut_penguin.png";

export type PenguinOutfit = {
  id: string;
  label: string;
  image: string;
  comingSoon?: boolean;
};

export const PENGUIN_OUTFITS: PenguinOutfit[] = [
  { id: "classic",    label: "Classic",    image: penguinBaseImg },
  { id: "fancy",      label: "Formal",     image: penguinSuitImg },
  { id: "pirate",     label: "Pirate",     image: penguinPirateImg },
  { id: "astronaut",  label: "Astronaut",  image: penguinAstronautImg },
  { id: "winter",     label: "Winter",     image: penguinCoatImg },
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
