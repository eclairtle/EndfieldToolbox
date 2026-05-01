import type { CharacterBase } from "@/data/characters";
import type { WeaponBase } from "@/data/weapons";
import type { GearBase } from "@/data/gears";

export const EMPTY_SELECTION_ICON_PATH = "/icons/no_selection.svg";

const WEAPON_IMAGE_BY_ID: Record<string, string> = {
  forgeborn_scathe: "/weapons/sword/wpn_sword_0006.webp",
  thermite_cutter: "/weapons/sword/wpn_sword_0012.webp",
  khravengger: "/weapons/claym/wpn_claym_0013.webp",
  artsy_tyrannical: "/weapons/pistol/wpn_pistol_0010.webp",
  clannibal: "/weapons/pistol/wpn_pistol_0009.webp",
  brigands_calling: "/weapons/pistol/wpn_pistol_0011.webp",
  jet: "/weapons/lance/wpn_lance_0011.webp",
  delivery_guaranteed: "/weapons/funnel/wpn_funnel_0011.webp",
  stanza_of_memorials: "/weapons/funnel/wpn_funnel_0005.webp",
  detonation_unit: "/weapons/funnel/wpn_funnel_0010.webp",
  dreams_of_the_starry_beach: "/weapons/funnel/wpn_funnel_0013.webp",
  chivalric_virtues: "/weapons/funnel/wpn_funnel_0008.webp",
};

export function getCharacterImagePath(character: Pick<CharacterBase, "id" | "imagePath"> | null | undefined): string {
  if (!character) {
    return EMPTY_SELECTION_ICON_PATH;
  }
  if (character.imagePath) {
    return character.imagePath;
  }
  const key = character.id.toUpperCase();
  return `/avatars/${key}/${key}.webp`;
}

export function getWeaponImagePath(weapon: Pick<WeaponBase, "id" | "imagePath"> | null | undefined): string {
  if (!weapon) {
    return EMPTY_SELECTION_ICON_PATH;
  }
  return weapon.imagePath ?? WEAPON_IMAGE_BY_ID[weapon.id] ?? "/weapons/default.webp";
}

export function getGearImagePath(gear: Pick<GearBase, "id" | "imagePath"> | null | undefined): string {
  if (!gear) {
    return EMPTY_SELECTION_ICON_PATH;
  }
  if (gear.imagePath) {
    return gear.imagePath;
  }

  const tail = gear.id.replace(/^item_equip_t\d+_(?:suit|parts)_/, "");
  const bits = tail.split("_");
  if (bits.length < 3) {
    return "/equipment/default.webp";
  }
  const folder = bits.slice(0, -2).join("_");
  if (!folder) {
    return "/equipment/default.webp";
  }
  return `/equipment/${folder}/${gear.id}.webp`;
}
