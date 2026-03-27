import type { CharacterBase } from "@/data/characters";
import type { WeaponSkillDef } from "@/data/weapons";
import { skillX } from "@/lib/build/weaponSkills";

export function getWeaponSkillLiveBonus(
  skill: WeaponSkillDef,
  rank: number,
  level: number,
  char: CharacterBase,
): string {
  const x = skillX(level);
  if (x <= 0) return "Inactive";
  const rankMultiplier = 1 - 0.2 * (3 - rank); // e.g. rank 3 = 1, rank 2 = 0.8, rank 1 = 0.6

  switch (skill.id) {
    case "STR_UP":
      return `+${Math.floor((4 + 16 * x) * rankMultiplier)} STR`;
    case "AGI_UP":
      return `+${Math.floor((4 + 16 * x) * rankMultiplier)} AGI`;
    case "INT_UP":
      return `+${Math.floor((4 + 16 * x) * rankMultiplier)} INT`;
    case "WIL_UP":
      return `+${Math.floor((4 + 16 * x) * rankMultiplier)} WIL`;
    case "MAIN_ATTR_UP":
      return `+${Math.floor((4 + 13.5 * x) * rankMultiplier)} ${char.mainAttr}`;
    case "ATK_UP":
      return `+${(Math.floor((10 + 40 * x) * rankMultiplier)/10).toFixed(1)}% ATK`;
    case "CRIT_UP":
      return `+${(Math.floor((5 + 20 * x) * rankMultiplier)/10).toFixed(1)}% Crit Rate`;
    case "ARTS_DMG_UP":
      return `+${(Math.floor((11.6 + 44.4 * x) * rankMultiplier)/10).toFixed(1)}% Arts DMG`;
    case "ARTS_INTENSITY_UP":
      return `+${Math.floor((2 + 8 * x) * rankMultiplier)} Arts Intensity`;
    case "HEALING_UP":
      return `+${(Math.floor((12.5 + 47.6 * x) * rankMultiplier)/10).toFixed(1)}% Treatment Efficiency`;
    case "ULT_GAIN_UP":
    case "CRYO_DMG_UP":
      return "Not applied yet";
    default:
      return "Not applied";
  }
}