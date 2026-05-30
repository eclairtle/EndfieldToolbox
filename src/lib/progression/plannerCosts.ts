import type { CharacterBase } from "@/data/characters";
import type { WeaponBase } from "@/data/weapons";
import type { CharacterBuildSlot } from "@/stores/buildStore";
import {
  getWeaponSkill1Range,
  getWeaponSkill2Range,
  getWeaponSkill3Range,
} from "@/lib/build/progression";
import {
  API_ITEM_NAME_OVERRIDES,
  API_ITEM_NAME_OVERRIDES_ZH,
  CHARACTER_API_COSTS,
  CHARACTER_LEVEL_UP_TABLE,
  WEAPON_API_COSTS,
  type CostItem,
} from "@/data/progression/apiCosts";
import { getWeaponApiCostFallbackByWeaponId } from "@/data/progression/weaponCostFallbacks";

type SkillKey = "basic" | "battleSkill" | "comboSkill" | "ultimate";

type CostLine = {
  id: string;
  name: string;
  amount: number;
  iconPath?: string;
};

export type PlannerCostResult = {
  lines: CostLine[];
  missingParts: string[];
  warnings?: string[];
};

const KNOWN_ITEM_NAMES: Record<string, string> = {
  item_gold: "T-Creds",
  item_character_exp_lv1_60: "Lv1~60 EXP",
  item_character_exp_lv61_90: "Lv61~90 EXP",
  item_weapon_exp: "Weapon EXP",
  item_char_skill_level_1_6: "Protoprism",
  item_char_skill_level_7_12: "Protohedron",
  item_char_break_stage_1_2: "Protodisk",
  item_char_break_stage_3_4: "Protoset",
  item_weapon_break_low: "Cast Die",
  item_weapon_break_high: "Heavy Cast Die",
  item_char_skill_specialize_2: "D96 Steel Sample 4",
  item_char_skill_specialize_4: "Metadiastima Photoemission Tube",
  item_weapon_etching_essence: "Flawless Essence",
};

const KNOWN_ITEM_NAMES_ZH: Record<string, string> = {
  item_weapon_etching_essence: "无暇基质",
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

function itemNameFromId(id: string, locale: "en" | "zh-CN" = "en") {
  if (id.startsWith("label:")) {
    return id.slice("label:".length);
  }
  const localeOverrides = locale === "zh-CN" ? API_ITEM_NAME_OVERRIDES_ZH : API_ITEM_NAME_OVERRIDES;
  const knownName = locale === "zh-CN" ? KNOWN_ITEM_NAMES_ZH[id] : KNOWN_ITEM_NAMES[id];
  return (
    localeOverrides[id]
    ?? knownName
    ?? id.replace(/^item_/, "").split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
  );
}

function iconPathFromId(id: string): string | undefined {
  if (id.startsWith("label:")) {
    return undefined;
  }
  if (id === "item_character_exp_lv1_60") {
    return "/item-icons/cost/item_expcard_stage1_high.webp";
  }
  if (id === "item_character_exp_lv61_90") {
    return "/item-icons/cost/item_expcard_stage2_high.webp";
  }
  if (id === "item_weapon_exp") {
    return "/item-icons/cost/item_weapon_expcard_high.webp";
  }
  if (id === "item_weapon_etching_essence") {
    return "/item-icons/cost/item_weapon_flawless_essence.webp";
  }
  return `/item-icons/cost/${id}.webp`;
}

function addItemCounts(target: Map<string, number>, items: CostItem[]) {
  for (const item of items) {
    target.set(item.id, (target.get(item.id) ?? 0) + item.count);
  }
}

function addDisplayCost(target: Map<string, number>, name: string, amount: number) {
  target.set(`label:${name}`, (target.get(`label:${name}`) ?? 0) + amount);
}

type WeaponEtchSkillType = "stat" | "unique";

const WEAPON_ETCH_ESSENCE_COSTS: Record<WeaponEtchSkillType, Record<number, number>> = {
  stat: {
    1: 0.7,
    2: 1.6,
    3: 4.3,
    4: 12.7,
    5: 23.4,
  },
  unique: {
    1: 3.2,
    2: 13.5,
  },
};

function addWeaponEtchingEssenceCost(args: {
  target: Map<string, number>;
  fromBonus: number;
  toBonus: number;
  skillType: WeaponEtchSkillType;
}) {
  if (args.toBonus <= args.fromBonus) {
    return;
  }
  let total = 0;
  const table = WEAPON_ETCH_ESSENCE_COSTS[args.skillType];
  for (let level = args.fromBonus; level < args.toBonus; level += 1) {
    total += table[level] ?? 0;
  }
  if (total > 0) {
    addItemCounts(args.target, [{ id: "item_weapon_etching_essence", count: total }]);
  }
}

function toSortedLines(costByKey: Map<string, number>, locale: "en" | "zh-CN" = "en"): CostLine[] {
  return [...costByKey.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([key, amount]) => ({
      id: key,
      name: itemNameFromId(key, locale),
      amount: Math.round(amount * 1000) / 1000,
      iconPath: iconPathFromId(key),
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
  locale?: "en" | "zh-CN";
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
      const expItemId = level < 60 ? "item_character_exp_lv1_60" : "item_character_exp_lv61_90";
      addItemCounts(costByKey, [{ id: expItemId, count: row.exp }]);
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
    lines: toSortedLines(costByKey, args.locale ?? "en"),
    missingParts: [...new Set(missingParts)],
    warnings: [],
  };
}

export function computeWeaponPlannerCost(args: {
  weapon: WeaponBase;
  currentSlot: CharacterBuildSlot;
  plannedSlot: CharacterBuildSlot;
  locale?: "en" | "zh-CN";
}): PlannerCostResult {
  const costByKey = new Map<string, number>();
  const missingParts: string[] = [];
  const warnings: string[] = [];
  const weaponApi = WEAPON_API_COSTS[normalizeId(args.weapon.id)] ?? getWeaponApiCostFallbackByWeaponId(args.weapon.id);

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

  const currentBaseLevel1 = getWeaponSkill1Range(args.currentSlot.weaponAscension).min;
  const currentBaseLevel2 = getWeaponSkill2Range(args.currentSlot.weaponAscension).min;
  const currentBaseLevel3 = getWeaponSkill3Range(args.currentSlot.weaponPotential).min;
  const plannedBaseLevel1 = getWeaponSkill1Range(args.plannedSlot.weaponAscension).min;
  const plannedBaseLevel2 = getWeaponSkill2Range(args.plannedSlot.weaponAscension).min;
  const plannedBaseLevel3 = getWeaponSkill3Range(args.plannedSlot.weaponPotential).min;
  const currentLevels = args.currentSlot.weaponSkillLevels;
  const plannedLevels = args.plannedSlot.weaponSkillLevels;
  const currentLevel1 = currentLevels[0] ?? currentBaseLevel1;
  const currentLevel2 = currentLevels[1] ?? currentBaseLevel2;
  const currentLevel3 = currentLevels[2] ?? currentBaseLevel3;
  const plannedLevel1 = plannedLevels[0] ?? plannedBaseLevel1;
  const plannedLevel2 = plannedLevels[1] ?? plannedBaseLevel2;
  const plannedLevel3 = plannedLevels[2] ?? plannedBaseLevel3;

  const currentBonuses = [
    Math.max(0, currentLevel1 - currentBaseLevel1),
    Math.max(0, currentLevel2 - currentBaseLevel2),
    Math.max(0, currentLevel3 - currentBaseLevel3),
  ] as const;
  const plannedBonuses = [
    Math.max(0, plannedLevel1 - plannedBaseLevel1),
    Math.max(0, plannedLevel2 - plannedBaseLevel2),
    Math.max(0, plannedLevel3 - plannedBaseLevel3),
  ] as const;
  const currentMismatched = currentBonuses.some((value) => value === 0);
  const plannedMismatched = plannedBonuses.some((value) => value === 0);

  if (plannedMismatched) {
    warnings.push(
      args.locale === "zh-CN"
        ? "目标配装存在不匹配刻蚀（至少一个技能为 +0），已跳过全部武器技能刻蚀成本计算。"
        : "Target build uses mismatched essence (+0 on at least one weapon skill), so all etching costs are skipped.",
    );
  } else {
    const etchStartBonuses = currentMismatched ? [1, 1, 1] as const : currentBonuses;
    if (currentMismatched) {
      addItemCounts(costByKey, [{ id: "item_weapon_etching_essence", count: 1 }]);
      warnings.push(
        args.locale === "zh-CN"
          ? "起始配装存在不匹配刻蚀，已按先切换至 +1/+1/+1 并额外计入 1 个刻蚀精华进行计算。"
          : "Starting build uses mismatched essence; cost assumes switching to +1/+1/+1 first and adds 1 extra essence.",
      );
    }

    addWeaponEtchingEssenceCost({
      target: costByKey,
      fromBonus: etchStartBonuses[0],
      toBonus: plannedBonuses[0],
      skillType: "stat",
    });
    addWeaponEtchingEssenceCost({
      target: costByKey,
      fromBonus: etchStartBonuses[1],
      toBonus: plannedBonuses[1],
      skillType: "stat",
    });
    addWeaponEtchingEssenceCost({
      target: costByKey,
      fromBonus: etchStartBonuses[2],
      toBonus: plannedBonuses[2],
      skillType: "unique",
    });
  }

  return {
    lines: toSortedLines(costByKey, args.locale ?? "en"),
    missingParts: [...new Set(missingParts)],
    warnings: [...new Set(warnings)],
  };
}
