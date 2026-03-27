// src/lib/weaponSkills.ts
import type { CharacterBase } from "@/data/characters";
import type { Attrs, AttrKey, ModifierStats } from "@/lib/build/stats";
import type { WeaponSkillId } from "@/data/weapons";

export function skillX(skillLevel: number): number {
  if (skillLevel <= 0) return 0;
  if (skillLevel >= 9) return 9.5;
  return skillLevel;
}

export function skillY(skillLevel: number): number {
  if (skillLevel <= 0) return 0;
  if (skillLevel >= 9) return 10;
  return skillLevel;
}

function addAttr(attrs: Attrs, key: AttrKey, amount: number): Attrs {
  return { ...attrs, [key]: attrs[key] + amount };
}

export function applyWeaponSkills(args: {
  char: CharacterBase;
  attrs: Attrs;
  skillIds: WeaponSkillId[];
  skillRanks: number[];
  skillLevels: number[];
  mods: ModifierStats;
}): { attrs: Attrs; mods: ModifierStats } {
  const { char } = args;
  let attrs = args.attrs;
  const mods = { ...args.mods };

  for (let i = 0; i < args.skillIds.length; i++) {
    const id = args.skillIds[i];
    const lv = args.skillLevels[i] ?? 0;
    const rank = args.skillRanks[i] ?? 3;
    const x = skillX(lv);
    if (x <= 0) continue;

    const rankMultiplier = 1 - 0.2 * (3 - rank); // e.g. rank 3 = 1, rank 2 = 0.8, rank 1 = 0.6

    switch (id) {
      case "STR_UP":
        attrs = addAttr(attrs, "STR", Math.floor((4 + 16 * x) * rankMultiplier));
        break;
      case "AGI_UP":
        attrs = addAttr(attrs, "AGI", Math.floor((4 + 16 * x) * rankMultiplier));
        break;
      case "INT_UP":
        attrs = addAttr(attrs, "INT", Math.floor((4 + 16 * x) * rankMultiplier));
        break;
      case "WIL_UP":
        attrs = addAttr(attrs, "WIL", Math.floor((4 + 16 * x) * rankMultiplier));
        break;
      case "MAIN_ATTR_UP":
        attrs = addAttr(attrs, char.mainAttr, Math.floor((4 + 13.5 * x) * rankMultiplier));
        break;
      case "ATK_UP":
        mods.ATK_PCT += Math.floor((10 + 40 * x) * rankMultiplier) / 1000;
        break;
      case "CRIT_UP":
        mods.CRIT_RATE_PCT += Math.floor((5 + 20 * x) * rankMultiplier) / 1000;
        break;
      case "ARTS_DMG_UP":
        mods.ARTS_DMG_PCT += Math.floor((11.6 + 44.4 * x) * rankMultiplier) / 1000;
        break;
      case "ARTS_INTENSITY_UP":
        mods.ARTS_INTENSITY += Math.floor((2 + 8 * x) * rankMultiplier);
        break;
      case "HEALING_UP":
        mods.HEALING_PCT += Math.floor((12.5 + 47.6 * x) * rankMultiplier) / 1000;
        break;
      default:
        break;
    }
  }

  return { attrs, mods };
}