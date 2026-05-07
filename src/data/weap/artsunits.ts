import { skillY } from "@/lib/build/weaponSkills";
import type { WeaponBase } from "@/data/weapons";
import { CHARACTERS } from "@/data/characters";
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

function getCharacterElementById(characterId: string) {
  return CHARACTERS.find((character) => character.id === characterId)?.element;
}

export const DELIVERY_GUARANTEED: WeaponBase = {
  id: "delivery_guaranteed",
  name: "Delivery Guaranteed",
  rarity: 6,
  imagePath: "/weapons/funnel/wpn_funnel_0011.webp",
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
      `For every enemy Lifted, the team gains bonus Arts DMG Dealt +${percent(scaledPercentFromRank1(3.5, y))}, up to a max of +${percent(scaledPercentFromRank1(10.5, y))}.`,
      "Effects of the same name cannot stack.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (
      sourceSlot !== ctx.wearer.slot
      || ctx.event.type !== "PHYSICAL_REACTION_APPLIED"
      || ctx.event.commandAttackType !== "COMBO_SKILL"
      || !ctx.event.label.startsWith("Lift Applied")
    ) {
      return;
    }
    if (!ctx.helpers.markOnce(`delivery_guaranteed:${ctx.wearer.slot}:${ctx.event.stepId ?? `${ctx.event.time}`}`)) {
      return;
    }
    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    const liftedEnemyCount = Math.max(0, Math.floor(ctx.event.amount ?? 1));
    const bonusArtsPercent = Math.min(
      scaledPercentFromRank1(10.5, y),
      scaledPercentFromRank1(3.5, y) * liftedEnemyCount,
    );
    ctx.helpers.applyTeamBuff({
      buffId: "weapon_delivery_guaranteed_team_arts",
      label: "Delivery Guaranteed",
      durationSeconds: 15,
      effects: {
        ARTS_DMG_PCT: (scaledPercentFromRank1(12, y) + bonusArtsPercent) / 100,
      },
      eventType: "WEAPON_BUFF_APPLIED",
    });
  },
};

export const STANZA_OF_MEMORIALS: WeaponBase = {
  id: "stanza_of_memorials",
  name: "Stanza of Memorials",
  rarity: 5,
  imagePath: "/weapons/funnel/wpn_funnel_0005.webp",
  weaponType: "ARTS_UNIT",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["Quadrant Fitting Fluid ×16", "Wulingstone ×8"],
  skills: [
    { id: "INT_UP", name: "Intellect Boost [M]", rank: 2, implemented: true },
    { id: "ATK_UP", name: "Attack Boost [M]", rank: 2, implemented: true },
    { id: "UNIQUE", name: "Twilight: Lustrous Pyre", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      HP_PCT: scaledPercentFromRank1(10, y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Max HP +${percent(scaledPercentFromRank1(10, y))}.`,
      `When the wielder casts an ultimate, operators whose elements differ from the wielder gain ATK +${percent(scaledPercentFromRank1(8, y))} for 20s.`,
      "Effects of the same name cannot stack.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "ULTIMATE_CAST") {
      return;
    }
    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    const wearerElement = getCharacterElementById(ctx.wearer.characterId);
    ctx.helpers.applyTeamBuffFiltered({
      buffId: "weapon_stanza_of_memorials_attack_team_diff_element",
      label: "Twilight: Lustrous Pyre",
      durationSeconds: 20,
      shouldApplyTo: (target) => {
        const targetElement = getCharacterElementById(target.characterId);
        if (!wearerElement || !targetElement) {
          return false;
        }
        return targetElement !== wearerElement;
      },
      effects: {
        ATK_PCT: scaledPercentFromRank1(8, y) / 100,
      },
      eventType: "WEAPON_BUFF_APPLIED",
    });
  },
};

export const DETONATION_UNIT: WeaponBase = {
  id: "detonation_unit",
  name: "Detonation Unit",
  rarity: 6,
  imagePath: "/weapons/funnel/wpn_funnel_0010.webp",
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
      `After the wielder applies an Arts Burst, target enemy suffers Arts DMG Taken +${percent(scaledPercentFromRank1(9, y))} for 15s.`,
      "Effects of the same name cannot stack.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "ARTS_BURST_APPLIED") {
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
  rarity: 6,
  imagePath: "/weapons/funnel/wpn_funnel_0013.webp",
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
  rarity: 6,
  imagePath: "/weapons/funnel/wpn_funnel_0008.webp",
  weaponType: "ARTS_UNIT",
  baseAtkTable: ATK_TABLE_49_485,
  tuningMaterials: ["D96 Steel Sample 4 ×16", "Wulingstone ×8"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [L]", rank: 3, implemented: true },
    { id: "HP_UP", name: "HP Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Medicant: Blight Fervor", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      HEALING_PCT: scaledPercentFromRank1(10, y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Treatment Efficiency +${percent(scaledPercentFromRank1(10, y))}.`,
      `After the wielder's skill provides treatment, the entire team gains ATK +${percent(scaledPercentFromRank1(9, y))} for 15s.`,
      "Effects of the same name cannot stack.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "HEALING_HIT_EXECUTED") {
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

export const MONAIHE: WeaponBase = {
  id: "monaihe",
  name: "Monaihe",
  rarity: 5,
  imagePath: "/weapons/funnel/wpn_funnel_0007.webp",
  weaponType: "ARTS_UNIT",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["Quadrant Fitting Fluid ×16", "Igneosite ×8"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [M]", rank: 2, implemented: true },
    { id: "ULT_GAIN_UP", name: "Ultimate Gain Efficiency Boost [M]", rank: 2, implemented: true },
    { id: "UNIQUE", name: "Inspiring: Mortise-and-Tenon Analysis", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      MAIN_ATTR_PCT: (5 + y) / 100,
      ARTS_INTENSITY: 25 + 5 * y,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Main Attribute +${percent(5 + y)}.`,
      `Arts Intensity +${(25 + 5 * y).toFixed(0)}.`,
    ].join("\n");
  },
};

export const WILD_WANDERER: WeaponBase = {
  id: "wild_wanderer",
  name: "Wild Wanderer",
  rarity: 5,
  imagePath: "/weapons/funnel/wpn_funnel_0004.webp",
  weaponType: "ARTS_UNIT",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["D96 Steel Sample 4 ×16", "Igneosite ×8"],
  skills: [
    { id: "INT_UP", name: "Intellect Boost [M]", rank: 2, implemented: true },
    { id: "NotImplemented", name: "Electric DMG Boost [M]", rank: 2, implemented: false },
    { id: "UNIQUE", name: "Infliction: Wilderness Cluster", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      ARTS_INTENSITY: 10 + 2 * y,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Arts Intensity +${(10 + 2 * y).toFixed(0)}.`,
      `When the wielder applies Electrification, the team gains Physical DMG Dealt and Electric DMG Dealt +${percent(8 + 1.6 * y)} for 15s.`,
      "Effects of the same name cannot stack.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (
      sourceSlot !== ctx.wearer.slot
      || ctx.event.type !== "ARTS_REACTION_APPLIED"
      || ctx.event.consumedElement !== "Electric"
    ) {
      return;
    }
    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    ctx.helpers.applyTeamBuff({
      buffId: "weapon_wild_wanderer_team_damage",
      label: "Wild Wanderer",
      durationSeconds: 15,
      effects: {
        PHYSICAL_DMG_PCT: (8 + 1.6 * y) / 100,
        ELECTRIC_DMG_PCT: (8 + 1.6 * y) / 100,
      },
      eventType: "WEAPON_BUFF_APPLIED",
    });
  },
};
