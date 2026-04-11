import { skillY } from "@/lib/build/weaponSkills";
import type { WeaponBase } from "@/data/weapons";
import {
  ATK_TABLE_42_411,
  ATK_TABLE_49_485,
  ATK_TABLE_50_490,
  ATK_TABLE_50_495,
  ATK_TABLE_51_500,
} from "@/data/weap/baseAtkTables";

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function scaledPercentFromRank1(rank1Percent: number, y: number): number {
  return rank1Percent * (0.8 + 0.2 * y);
}

export const DELIVERY_GUARANTEED: WeaponBase = {
  id: "delivery_guaranteed",
  name: "Delivery Guaranteed",
  weaponType: "ARTS_UNIT",
  baseAtkTable: ATK_TABLE_51_500,
  tuningMaterials: ["Tachyon Screening Lattice ×16", "Wulingstone ×8"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [L]", rank: 3, implemented: true },
    { id: "ULT_GAIN_UP", name: "Ultimate Gain Efficiency Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Pursuit: Duty Fulfilled", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      NATURE_DMG_PCT: scaledPercentFromRank1(16, y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Nature DMG Dealt +${percent(scaledPercentFromRank1(16, y))}.`,
      `After the wielder's combo skill applies Lifted, the team gains Arts DMG Dealt +${percent(scaledPercentFromRank1(12, y))} for 15s.`,
      "Effects of the same name cannot stack.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "BATTLE_OR_COMBO_HIT" || ctx.event.commandAttackType !== "COMBO_SKILL") {
      return;
    }
    if (!ctx.helpers.markOnce(`delivery_guaranteed:${ctx.wearer.slot}:${ctx.event.stepId ?? `${ctx.event.time}`}`)) {
      return;
    }
    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    ctx.helpers.applyTeamBuff({
      buffId: "weapon_delivery_guaranteed_team_arts",
      label: "Delivery Guaranteed",
      durationSeconds: 15,
      effects: {
        ARTS_DMG_PCT: scaledPercentFromRank1(12, y) / 100,
      },
      eventType: "WEAPON_BUFF_APPLIED",
    });
  },
};

export const STANZA_OF_MEMORIALS: WeaponBase = {
  id: "stanza_of_memorials",
  name: "Stanza of Memorials",
  weaponType: "ARTS_UNIT",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["Quadrant Fitting Fluid ×16", "Wulingstone ×8"],
  skills: [
    { id: "INT_UP", name: "Intellect Boost [M]", rank: 2, implemented: true },
    { id: "ATK_UP", name: "Attack Boost [M]", rank: 2, implemented: true },
    { id: "UNIQUE", name: "Conditional ATK Boost", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return `Gain ATK +${percent(scaledPercentFromRank1(10, y))} for 15s after the wielder's skill recovers SP. Effects of the same name cannot stack.`;
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "SKILL_SP_RECOVERED") {
      return;
    }
    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    ctx.helpers.applySelfBuff({
      buffId: "weapon_stanza_of_memorials_attack",
      label: "Stanza of Memorials",
      durationSeconds: 15,
      effects: {
        ATK_PCT: scaledPercentFromRank1(10, y) / 100,
      },
      eventType: "WEAPON_BUFF_APPLIED",
    });
  },
};

export const DETONATION_UNIT: WeaponBase = {
  id: "detonation_unit",
  name: "Detonation Unit",
  weaponType: "ARTS_UNIT",
  baseAtkTable: ATK_TABLE_50_490,
  tuningMaterials: ["Triphasic Nanoflake ×16", "Wulingstone ×8"],
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attribute Boost [L]", rank: 3, implemented: true },
    { id: "ARTS_INTENSITY_UP", name: "Arts Intensity Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Detonate: Imposing Champion", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      SECONDARY_ATTR_PCT: scaledPercentFromRank1(10, y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Secondary Attribute +${percent(scaledPercentFromRank1(10, y))}.`,
      `When the wielder triggers an Arts Reaction, target enemy suffers Arts DMG Taken +${percent(scaledPercentFromRank1(9, y))} for 15s.`,
      "Effects of the same name cannot stack.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "ARTS_REACTION_CONSUMED") {
      return;
    }
    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    ctx.helpers.applyEnemyBuff({
      buffId: "weapon_detonation_unit_arts_taken",
      label: "Detonation Unit",
      effects: {
        ARTS_DMG_TAKEN_PCT: scaledPercentFromRank1(9, y) / 100,
      },
      durationSeconds: 15,
      timeScale: "game",
    });
  },
};

export const DREAMS_OF_THE_STARRY_BEACH: WeaponBase = {
  id: "dreams_of_the_starry_beach",
  name: "Dreams of the Starry Beach",
  weaponType: "ARTS_UNIT",
  baseAtkTable: ATK_TABLE_50_495,
  tuningMaterials: ["Quadrant Fitting Fluid ×16", "Igneosite ×8"],
  skills: [
    { id: "INT_UP", name: "Intellect Boost [L]", rank: 3, implemented: true },
    { id: "HEALING_UP", name: "Treatment Efficiency Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Infliction: Tidal Murmurs", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      SECONDARY_ATTR_PCT: scaledPercentFromRank1(16, y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Secondary Attribute +${percent(scaledPercentFromRank1(16, y))}.`,
      `After the wielder consumes Corrosion, target enemy suffers Arts DMG Taken +${percent(scaledPercentFromRank1(10, y))} for 25s.`,
      "Effects of the same name cannot stack.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (
      sourceSlot !== ctx.wearer.slot
      || ctx.event.type !== "ARTS_REACTION_CONSUMED"
      || ctx.event.consumedElement !== "Nature"
    ) {
      return;
    }
    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    ctx.helpers.applyEnemyBuff({
      buffId: "weapon_dreams_of_the_starry_beach_arts_taken",
      label: "Dreams of the Starry Beach",
      effects: {
        ARTS_DMG_TAKEN_PCT: scaledPercentFromRank1(10, y) / 100,
      },
      durationSeconds: 25,
      timeScale: "game",
    });
  },
};

export const CHIVALRIC_VIRTUES: WeaponBase = {
  id: "chivalric_virtues",
  name: "Chivalric Virtues",
  weaponType: "ARTS_UNIT",
  baseAtkTable: ATK_TABLE_49_485,
  tuningMaterials: ["D96 Steel Sample 4 ×16", "Wulingstone ×8"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "HP Boost [L]", rank: 1, implemented: true },
    { id: "UNIQUE", name: "Medicant: Blight Fervor", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      HP_PCT: scaledPercentFromRank1(10, y) / 100,
      HEALING_PCT: scaledPercentFromRank1(10, y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Max HP +${percent(scaledPercentFromRank1(10, y))}.`,
      `Treatment Efficiency +${percent(scaledPercentFromRank1(10, y))}.`,
      `After the wielder's skill provides treatment, the entire team gains ATK +${percent(scaledPercentFromRank1(9, y))} for 15s.`,
      "Effects of the same name cannot stack.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot || (ctx.event.type !== "BATTLE_SKILL_CAST" && ctx.event.type !== "ULTIMATE_CAST")) {
      return;
    }
    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    ctx.helpers.applyTeamBuff({
      buffId: "weapon_chivalric_virtues_team_attack",
      label: "Chivalric Virtues",
      durationSeconds: 15,
      effects: {
        ATK_PCT: scaledPercentFromRank1(9, y) / 100,
      },
      eventType: "WEAPON_BUFF_APPLIED",
    });
  },
};
