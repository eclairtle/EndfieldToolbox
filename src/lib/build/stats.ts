// src/lib/stats.ts
import { characterAtLevel, type CharacterBase} from "@/data/characters";
import type { WeaponBase } from "@/data/weapons";
import { lerpLevel, mult } from "@/lib/math";
import { applyWeaponSkills } from "@/lib/build/weaponSkills";
import type { GearBase } from "@/data/gears";
import { applyGears } from "@/lib/build/gearsApply";
import type { GearInstance } from "./gearInstances";
import type { AscensionStage, PotentialLevel } from "./progression";
import { applyGenericCharacterTalents, type CharacterTalentToggles } from "./characterTalents";
import { mergeModifierDelta, applyActiveBuffsToMods, type BuffDefinition, type BuffInstance } from "../buffs";

export const ATTRIBUTE_KEYS = ["STR", "AGI", "INT", "WIL"] as const;
export type AttrKey = (typeof ATTRIBUTE_KEYS)[number];

export const CHARACTER_STAT_KEYS = ["STR", "AGI", "INT", "WIL", "ATK", "HP"] as const;
export type CharacterStatKey = (typeof CHARACTER_STAT_KEYS)[number];

export type Attrs = Record<AttrKey, number>;
export type CharacterStats = {
  STR: number;
  AGI: number;
  INT: number;
  WIL: number;
  ATK: number;
  HP: number;
};

export type LevelStatTable = {
  STR: number[]; // length 90, index 0 = Lv1
  AGI: number[];
  INT: number[];
  WIL: number[];
  ATK: number[];
  HP: number[];
};

export const MODIFIER_STAT_KEYS = [
  "CRIT_RATE_PCT",
  "CRIT_DMG_PCT",
  "ULT_GAIN_PCT",
  "MAIN_ATTR_PCT",
  "SECONDARY_ATTR_PCT",

  "ATK_PCT",
  "HP_PCT",
  "FLAT_ATK",
  "ARTS_INTENSITY",

  "PHYSICAL_DMG_PCT",
  "ARTS_DMG_PCT",
  "HEAT_DMG_PCT",
  "CRYO_DMG_PCT",
  "ELECTRIC_DMG_PCT",
  "NATURE_DMG_PCT",
  "BASIC_ATK_DMG_PCT",
  "SKILL_DMG_PCT",
  "BATTLE_SKILL_DMG_PCT",
  "COMBO_SKILL_DMG_PCT",
  "ULTIMATE_DMG_PCT",
  "DMG_TAKEN_PCT",
  "PHYSICAL_RESIST_PCT",
  "HEAT_RESIST_PCT",
  "CRYO_RESIST_PCT",
  "ELECTRIC_RESIST_PCT",
  "NATURE_RESIST_PCT",
  "AETHER_RESIST_PCT",

  "HEALING_PCT",
  "HEALING_RECEIVED_PCT",
  "PHYSICAL_SUS_PCT",
  "ARTS_SUS_PCT",
  "HEAT_SUS_PCT",
  "CRYO_SUS_PCT",
  "ELECTRIC_SUS_PCT",
  "NATURE_SUS_PCT",
] as const;

export type ModifierStatKey = (typeof MODIFIER_STAT_KEYS)[number];
export type ModifierStats = Record<ModifierStatKey, number>;

/**
 * Attribute bonus = sum(attr * coeff)
 * Example: Laevatain = INT*0.005 + STR*0.002
 */
export type AttributeScaling = Partial<Record<AttrKey, number>>;


export type FinalStatCard = {
  STR: number;
  AGI: number;
  INT: number;
  WIL: number;
  ATK: number;
  HP: number;
  DEF: number;
};

export function makeBaseModifierStats(): ModifierStats {
  return {
    CRIT_RATE_PCT: 0.05,              // 5%
    CRIT_DMG_PCT: 0.50,               // 50%
    ULT_GAIN_PCT: 1.0,                // 100%

    MAIN_ATTR_PCT: 0,
    SECONDARY_ATTR_PCT: 0,
    ATK_PCT: 0,
    HP_PCT: 0,
    FLAT_ATK: 0,
    ARTS_INTENSITY: 0,

    PHYSICAL_DMG_PCT: 0,
    ARTS_DMG_PCT: 0,
    HEAT_DMG_PCT: 0,
    CRYO_DMG_PCT: 0,
    ELECTRIC_DMG_PCT: 0,
    NATURE_DMG_PCT: 0,

    BASIC_ATK_DMG_PCT: 0,
    SKILL_DMG_PCT: 0,
    BATTLE_SKILL_DMG_PCT: 0,
    COMBO_SKILL_DMG_PCT: 0,
    ULTIMATE_DMG_PCT: 0,
    DMG_TAKEN_PCT: 0,
    PHYSICAL_RESIST_PCT: 0,
    HEAT_RESIST_PCT: 0,
    CRYO_RESIST_PCT: 0,
    ELECTRIC_RESIST_PCT: 0,
    NATURE_RESIST_PCT: 0,
    AETHER_RESIST_PCT: 0,

    HEALING_PCT: 0,
    HEALING_RECEIVED_PCT: 0,
    PHYSICAL_SUS_PCT: 0,
    ARTS_SUS_PCT: 0,
    HEAT_SUS_PCT: 0,
    CRYO_SUS_PCT: 0,
    ELECTRIC_SUS_PCT: 0,
    NATURE_SUS_PCT: 0,

  };
}

function applyAttributePercentMods(
  attrs: Attrs,
  char: CharacterBase,
  mods: ModifierStats,
): Attrs {
  let out = { ...attrs };

  if (mods.MAIN_ATTR_PCT > 0) {
    const key = char.mainAttr;
    out[key] = out[key] + Math.ceil(out[key] * mods.MAIN_ATTR_PCT);
  }

  if (mods.SECONDARY_ATTR_PCT > 0) {
    const key = char.secondaryAttr;
    out[key] = out[key] + Math.ceil(out[key] * mods.SECONDARY_ATTR_PCT);
  }

  return out;
}

export type FinalStats = {
  level: number;
  weaponLevel: number;

  attrs: Attrs;          // STR/AGI/INT/WIL after level scaling
  baseATK: number;       // scaled base ATK (before weapon)
  weaponATK: number;     // weapon base atk at weaponLevel

  attributeBonus: number; // e.g. 0.143 means +14.3%
  finalATK: number;

  baseHP: number;        // scaled base HP (Lv-scaled, before STR*5)
  finalHP: number;

  mods: ModifierStats;    // expose this in the UI
  extraStats: Record<string, number>;

  // convenience display for full stat card
  statsCard: FinalStatCard;
};

function baseStatsAtLevel(char: CharacterBase, level: number) {
  return characterAtLevel(char.levels, level);
}

function attributeBonus(char: CharacterBase, attrs: Attrs): number {
  let b = 0;
  for (const k of Object.keys(char.scaling) as (keyof Attrs)[]) {
    b += attrs[k] * (char.scaling[k] ?? 0);
  }
  return b;
}

export function computeFinalStats(args: {
  char: CharacterBase;
  level: number;
  weapon: WeaponBase;
  weaponLevel: number;
  weaponSkillLevels: number[];
  gearBases: (GearBase | null)[];
  gearInstances: (GearInstance | null)[];

  characterAscensionStage: AscensionStage;
  characterTalentToggles: CharacterTalentToggles;

  weaponAscensionStage: AscensionStage;
  weaponPotential: PotentialLevel;

  // For now these are 0 in the UI; later you’ll feed buffs/food/etc here:
  atkPct?: number;    // e.g. 0.25
  flatAtk?: number;   // e.g. +500
  hpPct?: number;     // e.g. 0.15
  extraModifierDeltas?: Partial<ModifierStats>;
  buffDefinitions?: BuffDefinition[];
  buffStates?: BuffInstance[];
}): FinalStats {
  const { char, weapon } = args;
  const level = args.level;
  const weaponLevel = args.weaponLevel;

  let atkPct = args.atkPct ?? 0;
  const flatAtk = args.flatAtk ?? 0;
  const hpPct = args.hpPct ?? 0;

  let mods = makeBaseModifierStats();
  const extraStats: Record<string, number> = {};

  // 1) base stats at level (before weapon, gear, or weapon skills)
  const baseLevelStats = baseStatsAtLevel(char, level);
  let attrs: Attrs = {
    STR: baseLevelStats.STR,
    AGI: baseLevelStats.AGI,
    INT: baseLevelStats.INT,
    WIL: baseLevelStats.WIL,
  };
  const baseATK = baseLevelStats.ATK;
  const baseHP = baseLevelStats.HP;

  // 2) apply gear subs (attrs + DEF)
  const gearRes = applyGears({
    attrs,
    gearBases: args.gearBases,
    gearInstances: args.gearInstances,
    mods,
  });
  attrs = gearRes.attrs;
  mods = gearRes.mods;
  const gearDEF = gearRes.defFlat;

  // 3) apply weapon skills that change attrs / atkPct
  const weaponRes = applyWeaponSkills({
    char,
    attrs,
    skillIds: weapon.skills.map((s) => s.id),
    skillRanks: weapon.skills.map((s) => s.rank),
    skillLevels: args.weaponSkillLevels,
    mods,
  });
  attrs = weaponRes.attrs;
  mods = weaponRes.mods;

  attrs = applyGenericCharacterTalents({
    char,
    attrs,
    ascensionStage: args.characterAscensionStage,
    toggles: args.characterTalentToggles,
  });

  // 4) apply manual bonus
  mods.ATK_PCT += atkPct;
  mods.HP_PCT += hpPct;
  mods.FLAT_ATK += flatAtk;

  if (args.extraModifierDeltas) {
    mods = mergeModifierDelta(mods, args.extraModifierDeltas);
  }

  if (args.buffDefinitions && args.buffStates) {
    mods = applyActiveBuffsToMods(mods, args.buffDefinitions, args.buffStates);
  }
  
  // 5) apply main/secondary attr %
  attrs = applyAttributePercentMods(attrs, char, mods);

  // Every 1 point of WIL gives +0.1% healing received bonus.
  mods.HEALING_RECEIVED_PCT += attrs.WIL * 0.001;

  // 6) weapon base ATK
  const weaponATK = lerpLevel(weapon.baseAtkLv1, weapon.baseAtkLv90, weaponLevel);

  // 7) attribute bonus (after weapon-added attrs)
  const attrBonus = attributeBonus(char, attrs);

  // final ATK
  const rawATK = baseATK + weaponATK;
  const modATK = Math.round(rawATK * mods.ATK_PCT);
  const finalATK = Math.floor((rawATK + modATK + mods.FLAT_ATK) * (1 + attrBonus));

  // final HP
  const finalHP = Math.round((baseHP + attrs.STR * 5) * (1 + mods.HP_PCT));

  const finalDEF = gearDEF;

  const statsCard = {
    STR: attrs.STR,
    AGI: attrs.AGI,
    INT: attrs.INT,
    WIL: attrs.WIL,
    ATK: finalATK,
    HP: finalHP,
    DEF: finalDEF,
  };

  return {
    level,
    weaponLevel,
    attrs,
    baseATK,
    weaponATK,
    attributeBonus: attrBonus,
    finalATK,
    baseHP,
    finalHP,
    mods,
    extraStats,
    statsCard,
  };
}
