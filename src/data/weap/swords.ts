import { skillY } from "@/lib/build/weaponSkills";
import type { WeaponBase } from "@/data/weapons";
import { ATK_TABLE_50_490, ATK_TABLE_50_495, ATK_TABLE_51_505, ATK_TABLE_52_510 } from "@/data/weap/baseAtkTables";

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function scaledPercentFromRank1(rank1Percent: number, y: number): number {
  return rank1Percent * (0.8 + 0.2 * y);
}

export const FORGEBORN_SCATHE: WeaponBase = {
  id: "forgeborn_scathe",
  name: "Forgeborn Scathe",
  rarity: 6,
  imagePath: "/weapons/sword/wpn_sword_0006.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_52_510,
  tuningMaterials: ["D96 Steel Sample 4 ×16", "Wulingstone ×8"],
  skills: [
    { id: "INT_UP", name: "Intellect Boost [L]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "Attack Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Twilight: Blazing Wail", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      HEAT_DMG_PCT: (12.8 + 3.2 * y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Heat DMG Dealt +${percent(12.8 + 3.2 * y)}.`,
      `When the wielder casts an Ultimate, gain Basic Attack DMG Dealt +${percent(60 + 15 * y)} for 20s.`,
      "Effects of the same name cannot stack.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "ULTIMATE_CAST") {
      return;
    }

    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    ctx.helpers.applySelfBuff({
      buffId: "weapon_forgeborn_scathe_basic_attack",
      label: "Forgeborn Scathe",
      durationSeconds: 20,
      effects: {
        BASIC_ATK_DMG_PCT: (60 + 15 * y) / 100,
      },
      eventType: "WEAPON_BUFF_APPLIED",
    });
  },
};

export const EMINENT_REPUTE: WeaponBase = {
  id: "eminent_repute",
  name: "Eminent Repute",
  rarity: 6,
  imagePath: "/weapons/sword/wpn_sword_0013.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_50_490,
  tuningMaterials: ["Tachyon Screening Lattice ×16", "Wulingstone ×8"],
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attribute Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Physical DMG Boost [L]", rank: 1, implemented: true },
    { id: "UNIQUE", name: "Brutality: Disciplinarian", rank: 1, implemented: false },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      PHYSICAL_DMG_PCT: scaledPercentFromRank1(5.6, y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Physical DMG Dealt +${percent(scaledPercentFromRank1(5.6, y))}.`,
      `ATK +${percent(scaledPercentFromRank1(10, y))}.`,
      "After the wielder consumes Vulnerability stack(s), the wielder gains ATK and other operators in the team gain half of this buff for 20s.",
      "Effects of the same name cannot stack.",
    ].join("\n");
  },
};

export const WHITE_NIGHT_NOVA: WeaponBase = {
  id: "white_night_nova",
  name: "White Night Nova",
  rarity: 6,
  imagePath: "/weapons/sword/wpn_sword_0014.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_51_505,
  tuningMaterials: ["Quadrant Fitting Fluid ×16", "Igneosite ×8"],
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attribute Boost [L]", rank: 3, implemented: true },
    { id: "ARTS_INTENSITY_UP", name: "Arts Intensity Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Infliction: White Night Nova", rank: 1, implemented: false },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      ARTS_DMG_PCT: scaledPercentFromRank1(12, y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Arts DMG Dealt +${percent(scaledPercentFromRank1(12, y))}.`,
      `After the wielder applies Combustion or Electrification, gain Arts DMG Dealt +${percent(scaledPercentFromRank1(12, y))} and Arts Intensity +${(25 * (0.8 + 0.2 * y)).toFixed(1)} for 15s.`,
      "Effects of the same name cannot stack.",
    ].join("\n");
  },
};

export const FORMER_FINERY: WeaponBase = {
  id: "former_finery",
  name: "Former Finery",
  rarity: 6,
  imagePath: "/weapons/claym/wpn_claym_0006.webp",
  weaponType: "GREATSWORD",
  baseAtkTable: ATK_TABLE_50_495,
  tuningMaterials: ["Metadiastima Photoemission Tube ×16", "Wulingstone ×8"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "HP Boost [L]", rank: 1, implemented: true },
    { id: "UNIQUE", name: "Efficacy: Mincing Therapy", rank: 1, implemented: false },
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
      `After a Protected operator takes DMG, the wielder restores HP by [${(84 * (0.8 + 0.2 * y)).toFixed(0)} + Will × ${((0.8 + 0.2 * y)).toFixed(1)}].`,
      "Effect only triggers once every 15s.",
    ].join("\n");
  },
};

export const THERMITE_CUTTER: WeaponBase = {
  id: "thermite_cutter",
  name: "Thermite Cutter",
  rarity: 6,
  imagePath: "/weapons/sword/wpn_sword_0012.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_50_490,
  tuningMaterials: ["D96 Steel Sample 4 ×16", "Igneosite ×8"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [L]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "Attack Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Flow: Thermal Release", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      ATK_PCT: (8 + 2 * y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `ATK +${percent(8 + 2 * y)}.`,
      `After the wielder's skill recovers SP or grants a Link state, the entire team gains ATK +${percent(4 + y)} for 20s.`,
      "Max stacks for effects of the same name: 2. Duration of each stack is counted separately.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (
      sourceSlot !== ctx.wearer.slot
      || (ctx.event.type !== "SKILL_SP_RECOVERED" && ctx.event.type !== "TEAM_LINK_GAINED")
    ) {
      return;
    }

    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    ctx.helpers.applyTeamBuff({
      buffId: "weapon_thermite_cutter_team_attack",
      label: "Thermite Cutter",
      durationSeconds: 20,
      effects: {
        ATK_PCT: (4 + y) / 100,
      },
      stackGroup: "weapon_thermite_cutter_team_attack",
      maxStacks: 2,
      eventType: "WEAPON_BUFF_APPLIED",
    });
  },
};

export const KHRAVENGGER: WeaponBase = {
  id: "khravengger",
  name: "Khravengger",
  rarity: 6,
  imagePath: "/weapons/claym/wpn_claym_0013.webp",
  weaponType: "GREATSWORD",
  baseAtkTable: ATK_TABLE_51_505,
  tuningMaterials: ["Triphasic Nanoflake ×16", "Wulingstone ×8"],
  skills: [
    { id: "STR_UP", name: "Strength Boost [L]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "Attack Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Detonate: Bonechilling", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      SKILL_DMG_PCT: (16 + 4 * y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Skill DMG Dealt +${percent(16 + 4 * y)}.`,
      `When the wielder's battle skill applies Cryo Infliction, gain Cryo DMG Dealt +${percent(8 + 2 * y)} for 15s.`,
      `When the wielder deals combo skill DMG to an enemy with Cryo Infliction, gain Cryo DMG Dealt +${percent(16 + 4 * y)} for 15s.`,
      "The two effects apply separately and do not stack with themselves.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "BATTLE_OR_COMBO_HIT") {
      return;
    }

    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    if (ctx.event.commandAttackType === "BATTLE_SKILL") {
      ctx.helpers.applySelfBuff({
        buffId: "weapon_khravengger_battle_skill_cryo_damage",
        label: "Khravengger",
        durationSeconds: 15,
        effects: {
          CRYO_DMG_PCT: (8 + 2 * y) / 100,
        },
        eventType: "WEAPON_BUFF_APPLIED",
      });
      return;
    }

    if (ctx.event.commandAttackType === "COMBO_SKILL") {
      ctx.helpers.applySelfBuff({
        buffId: "weapon_khravengger_combo_skill_cryo_damage",
        label: "Khravengger",
        durationSeconds: 15,
        effects: {
          CRYO_DMG_PCT: (16 + 4 * y) / 100,
        },
        eventType: "WEAPON_BUFF_APPLIED",
      });
    }
  },
};

export const LUPINE_SCARLET: WeaponBase = {
  id: "lupine_scarlet",
  name: "Lupine Scarlet",
  rarity: 6,
  imagePath: "/weapons/sword/wpn_sword_0022.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_51_505,
  tuningMaterials: ["Triphasic Nanoflake ×16", "Igneosite ×8"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [L]", rank: 3, implemented: true },
    { id: "CRIT_UP", name: "Critical Rate Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Fracture: Gnashing Wolves", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      ATK_PCT: (12.8 + 3.2 * y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `ATK +${percent(12.8 + 3.2 * y)}.`,
      `After the wielder's skill deals Critical DMG, gain 1 stack of Wolven Blood for 20s: Physical DMG Dealt and Heat DMG Dealt +${percent(0.8 + 0.2 * y)}.`,
      "Wolven Blood max stacks: 16.",
      `After reaching 16 stacks, gain another Physical DMG Dealt and Heat DMG Dealt +${percent(19.2 + 4.8 * y)} for 20s.`,
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "CRIT_THRESHOLD_REACHED") {
      return;
    }
    if (ctx.event.commandAttackType !== "BATTLE_SKILL" && ctx.event.commandAttackType !== "COMBO_SKILL" && ctx.event.commandAttackType !== "ULTIMATE") {
      return;
    }
    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    const critCount = Math.max(0, Math.floor(ctx.event.amount ?? 0));
    if (critCount <= 0) {
      return;
    }
    const beforeStacks = ctx.helpers.getSelfBuffStackCount("weapon_lupine_scarlet_wolven_blood");

    for (let i = 0; i < critCount; i += 1) {
      ctx.helpers.applySelfBuff({
        buffId: "weapon_lupine_scarlet_wolven_blood",
        label: "Lupine Scarlet",
        durationSeconds: 20,
        effects: {
          PHYSICAL_DMG_PCT: (1 + 0.2 * y) / 100,
          HEAT_DMG_PCT: (1 + 0.2 * y) / 100,
        },
        stackGroup: "weapon_lupine_scarlet_wolven_blood",
        maxStacks: 16,
        refreshExistingStacks: false,
        eventType: "WEAPON_BUFF_APPLIED",
      });
    }

    const afterStacks = ctx.helpers.getSelfBuffStackCount("weapon_lupine_scarlet_wolven_blood");
    if (afterStacks >= 16) {
      ctx.helpers.applySelfBuff({
        buffId: "weapon_lupine_scarlet_wolven_frenzy",
        label: "Lupine Scarlet",
        durationSeconds: 20,
        effects: {
          PHYSICAL_DMG_PCT: (24 + 4.8 * y) / 100,
          HEAT_DMG_PCT: (24 + 4.8 * y) / 100,
        },
        eventType: "WEAPON_BUFF_APPLIED",
      });
    }
  },
};
