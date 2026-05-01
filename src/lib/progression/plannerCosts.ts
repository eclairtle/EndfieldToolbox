import type { CharacterBase } from "@/data/characters";
import type { WeaponBase } from "@/data/weapons";
import type { CharacterBuildSlot } from "@/stores/buildStore";
import {
  API_ITEM_NAME_OVERRIDES,
  CHARACTER_API_COSTS,
  CHARACTER_LEVEL_UP_TABLE,
  WEAPON_API_COSTS,
  type CostItem,
} from "@/data/progression/apiCosts";

type SkillKey = "basic" | "battleSkill" | "comboSkill" | "ultimate";

type CostLine = {
  name: string;
  amount: number;
};

export type PlannerCostResult = {
  lines: CostLine[];
  missingParts: string[];
};

const KNOWN_ITEM_NAMES: Record<string, string> = {
  item_gold: "T-Creds",
  item_character_exp: "Character EXP",
  item_weapon_exp: "Weapon EXP",
  item_char_skill_level_1_6: "Protoprism",
  item_char_skill_level_7_12: "Protohedron",
  item_char_break_stage_1_2: "Protodisk",
  item_char_break_stage_3_4: "Protoset",
  item_weapon_break_low: "Cast Die",
  item_weapon_break_high: "Heavy Cast Die",
  item_char_skill_specialize_2: "D96 Steel Sample 4",
  item_char_skill_specialize_4: "Metadiastima Photoemission Tube",
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function stripRomanSuffix(value: string): { base: string; level: number | null } {
  const match = value.trim().match(/^(.*?)(?:\s+(I|II|III|IV|V))?$/i);
  if (!match) {
    return { base: value, level: null };
  }
  const roman = (match[2] ?? "").toUpperCase();
  const romanToLevel: Record<string, number> = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
  };
  return {
    base: (match[1] ?? value).trim(),
    level: roman ? romanToLevel[roman] ?? null : null,
  };
}

function itemNameFromId(id: string) {
  if (id.startsWith("label:")) {
    return id.slice("label:".length);
  }
  return (
    KNOWN_ITEM_NAMES[id]
    ?? API_ITEM_NAME_OVERRIDES[id]
    ?? id.replace(/^item_/, "").split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
  );
}

function addItemCounts(target: Map<string, number>, items: CostItem[]) {
  for (const item of items) {
    target.set(item.id, (target.get(item.id) ?? 0) + item.count);
  }
}

function addDisplayCost(target: Map<string, number>, name: string, amount: number) {
  target.set(`label:${name}`, (target.get(`label:${name}`) ?? 0) + amount);
}

function toSortedLines(costByKey: Map<string, number>): CostLine[] {
  return [...costByKey.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([key, amount]) => ({
      name: itemNameFromId(key),
      amount: Math.round(amount * 1000) / 1000,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function matchUniqueTalentCost(
  talentName: string,
  costs: Array<{ name: string; level: number; costs: CostItem[] }>,
): CostItem[] | null {
  const target = stripRomanSuffix(talentName);
  const targetBase = normalizeText(target.base);
  const exact = costs.filter((entry) => normalizeText(entry.name) === targetBase);
  if (target.level != null) {
    const leveled = exact.find((entry) => entry.level === target.level);
    if (leveled) return leveled.costs;
  }
  if (exact.length === 1) return exact[0]!.costs;

  const contains = costs.filter((entry) => normalizeText(entry.name).includes(targetBase));
  if (target.level != null) {
    const leveled = contains.find((entry) => entry.level === target.level);
    if (leveled) return leveled.costs;
  }
  return contains.length === 1 ? contains[0]!.costs : null;
}

export function computeCharacterPlannerCost(args: {
  character: CharacterBase;
  currentSlot: CharacterBuildSlot;
  plannedSlot: CharacterBuildSlot;
}): PlannerCostResult {
  const costByKey = new Map<string, number>();
  const missingParts: string[] = [];
  const charApi = CHARACTER_API_COSTS[normalizeId(args.character.id)];

  for (let level = args.currentSlot.level; level < args.plannedSlot.level; level += 1) {
    const row = CHARACTER_LEVEL_UP_TABLE[level];
    if (!row) {
      missingParts.push("character leveling");
      break;
    }
    if (row.exp > 0) {
      addItemCounts(costByKey, [{ id: "item_character_exp", count: row.exp }]);
    }
    if (row.gold > 0) {
      addItemCounts(costByKey, [{ id: "item_gold", count: row.gold }]);
    }
  }

  for (let stage = args.currentSlot.characterAscension + 1; stage <= args.plannedSlot.characterAscension; stage += 1) {
    const stageKey = stage as 1 | 2 | 3 | 4;
    const apiCosts = charApi?.ascensionByStage?.[stageKey];
    if (apiCosts?.length) {
      addItemCounts(costByKey, apiCosts);
      continue;
    }
    const fallbackPromotion = args.character.promotions?.find((promotion) => promotion.stage === stageKey);
    if (!fallbackPromotion) {
      missingParts.push(`character ascension stage ${stage}`);
      continue;
    }
    for (const item of fallbackPromotion.costs) {
      addDisplayCost(costByKey, item.resource, item.amount);
    }
  }

  const skillKeys: SkillKey[] = ["basic", "battleSkill", "comboSkill", "ultimate"];
  for (const skillKey of skillKeys) {
    const currentLevel = args.currentSlot.characterSkillLevels[skillKey];
    const plannedLevel = args.plannedSlot.characterSkillLevels[skillKey];
    if (plannedLevel <= currentLevel) continue;

    for (let level = currentLevel + 1; level <= plannedLevel; level += 1) {
      const costs = charApi?.skillByKey?.[skillKey]?.[level];
      if (!costs) {
        missingParts.push(`${skillKey} level ${level}`);
        continue;
      }
      addItemCounts(costByKey, costs);
    }
  }

  const genericTalentKeys = ["TALENT_1", "TALENT_2", "TALENT_3", "TALENT_4"] as const;
  for (let index = 0; index < genericTalentKeys.length; index += 1) {
    const key = genericTalentKeys[index]!;
    const enabledNow = args.currentSlot.characterTalentToggles[key];
    const enabledPlanned = args.plannedSlot.characterTalentToggles[key];
    if (enabledNow || !enabledPlanned) continue;

    const costs = charApi?.genericTalentCosts[index]?.costs;
    if (!costs) {
      missingParts.push(`${key} unlock`);
      continue;
    }
    addItemCounts(costByKey, costs);
  }

  for (const key of Object.keys({ ...args.currentSlot.uniqueTalentToggles, ...args.plannedSlot.uniqueTalentToggles })) {
    const enabledNow = args.currentSlot.uniqueTalentToggles[key] === true;
    const enabledPlanned = args.plannedSlot.uniqueTalentToggles[key] === true;
    if (enabledNow || !enabledPlanned) continue;

    const talentName = args.character.uniqueTalentDefs?.[key]?.name;
    if (!talentName) {
      missingParts.push(`${key} unlock`);
      continue;
    }
    const costs = charApi?.uniqueTalentCosts
      ? matchUniqueTalentCost(talentName, charApi.uniqueTalentCosts)
      : null;
    if (!costs) {
      missingParts.push(`${talentName} unlock`);
      continue;
    }
    addItemCounts(costByKey, costs);
  }

  return {
    lines: toSortedLines(costByKey),
    missingParts: [...new Set(missingParts)],
  };
}

export function computeWeaponPlannerCost(args: {
  weapon: WeaponBase;
  currentSlot: CharacterBuildSlot;
  plannedSlot: CharacterBuildSlot;
}): PlannerCostResult {
  const costByKey = new Map<string, number>();
  const missingParts: string[] = [];
  const weaponApi = WEAPON_API_COSTS[normalizeId(args.weapon.id)];

  for (let level = args.currentSlot.weaponLevel; level < args.plannedSlot.weaponLevel; level += 1) {
    const row = weaponApi?.levelUpByLevel?.[level];
    if (!row) {
      missingParts.push("weapon leveling");
      break;
    }
    if (row.exp > 0) {
      addItemCounts(costByKey, [{ id: "item_weapon_exp", count: row.exp }]);
    }
    if (row.gold > 0) {
      addItemCounts(costByKey, [{ id: "item_gold", count: row.gold }]);
    }
  }

  for (let stage = args.currentSlot.weaponAscension + 1; stage <= args.plannedSlot.weaponAscension; stage += 1) {
    const stageKey = stage as 1 | 2 | 3 | 4;
    const costs = weaponApi?.tuningByAscension?.[stageKey];
    if (!costs) {
      missingParts.push(`weapon tuning stage ${stage}`);
      continue;
    }
    addItemCounts(costByKey, costs);
  }

  return {
    lines: toSortedLines(costByKey),
    missingParts: [...new Set(missingParts)],
  };
}
