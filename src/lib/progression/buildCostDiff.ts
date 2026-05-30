import type { CharacterBuildSlot } from "@/stores/buildStore";
import type { PlannerCostResult } from "@/lib/progression/plannerCosts";
import { convertResourceAmountToSanity, type ResourceId } from "@/lib/progression/resources";
import { getWeaponSkill1Range, getWeaponSkill2Range, getWeaponSkill3Range } from "@/lib/build/progression";

export type BuildCostLine = {
  id: string;
  name: string;
  iconPath?: string;
  amount: number;
};

const COST_ITEM_TO_RESOURCE_ID: Partial<Record<string, ResourceId>> = {
  item_gold: "T_CREDITS",
  item_character_exp_lv1_60: "CHARACTER_EXP_BASIC",
  item_character_exp_lv61_90: "CHARACTER_EXP_ADVANCED",
  item_weapon_exp: "WEAPON_EXP",
  item_weapon_etching_essence: "WEAPON_ETCHING_ESSENCE",
  item_char_break_stage_1_2: "PROTODISK",
  item_char_break_stage_3_4: "PROTOSET",
  item_weapon_break_low: "CAST_DIE",
  item_weapon_break_high: "HEAVY_CAST_DIE",
  item_char_skill_level_1_6: "PROTOPRISM",
  item_char_skill_level_7_12: "PROTOHEDRON",
  item_char_skill_specialize_2: "D96_STEEL_SAMPLE_4",
  item_char_skill_specialize_1: "METADIASTIMA_PHOTOEMISSION_TUBE",
  item_char_skill_specialize_3: "TACHYON_SCREENING_LATTICE",
  item_char_skill_specialize_4: "QUADRANT_FITTING_FLUID",
  item_char_skill_specialize_5: "TRIPHASIC_NANOFLAKE",
};

export function buildDeltaCostLines(args: {
  forward: PlannerCostResult;
  backward: PlannerCostResult;
  skipIds?: ReadonlySet<string>;
  sanityLabel: string;
}): { lines: BuildCostLine[]; missingParts: string[]; warnings: string[] } {
  const deltaById = new Map<string, BuildCostLine>();
  for (const line of args.forward.lines) {
    if (args.skipIds?.has(line.id)) continue;
    const existing = deltaById.get(line.id);
    if (existing) {
      existing.amount += line.amount;
    } else {
      deltaById.set(line.id, { id: line.id, name: line.name, iconPath: line.iconPath, amount: line.amount });
    }
  }
  for (const line of args.backward.lines) {
    if (args.skipIds?.has(line.id)) continue;
    const existing = deltaById.get(line.id);
    if (existing) {
      existing.amount -= line.amount;
    } else {
      deltaById.set(line.id, { id: line.id, name: line.name, iconPath: line.iconPath, amount: -line.amount });
    }
  }

  const lines = [...deltaById.values()]
    .filter((line) => Math.abs(line.amount) > 0.0005)
    .map((line) => ({ ...line, amount: Math.round(line.amount * 1000) / 1000 }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const sanityTotal = lines.reduce((sum, line) => {
    const resourceId = COST_ITEM_TO_RESOURCE_ID[line.id];
    if (!resourceId) return sum;
    return sum + convertResourceAmountToSanity(line.amount, resourceId);
  }, 0);

  if (Math.abs(sanityTotal) > 0.0005) {
    lines.push({
      id: "__sanity_equivalent__",
      name: args.sanityLabel,
      amount: Math.round(sanityTotal * 1000) / 1000,
    });
  }

  return {
    lines,
    missingParts: [...new Set([...args.forward.missingParts, ...args.backward.missingParts])],
    warnings: [...new Set([...(args.forward.warnings ?? []), ...(args.backward.warnings ?? [])])],
  };
}

export function getWeaponEssenceBonuses(slot: CharacterBuildSlot): [number, number, number] {
  const base1 = getWeaponSkill1Range(slot.weaponAscension).min;
  const base2 = getWeaponSkill2Range(slot.weaponAscension).min;
  const base3 = getWeaponSkill3Range(slot.weaponPotential).min;
  return [
    Math.max(0, (slot.weaponSkillLevels[0] ?? base1) - base1),
    Math.max(0, (slot.weaponSkillLevels[1] ?? base2) - base2),
    Math.max(0, (slot.weaponSkillLevels[2] ?? base3) - base3),
  ];
}

export function hasMismatchedWeaponEssence(slot: CharacterBuildSlot): boolean {
  return getWeaponEssenceBonuses(slot).some((bonus) => bonus === 0);
}
